#! /usr/bin/env node

let Rx = require('rx');
let _ = require('lodash');
let Observable = Rx.Observable;
let extend = require('extend');
let clc = require('cli-color');
let columnify = require('columnify');

let arrayize = function(args) {
    return args.length === 1 && args[0] instanceof Array ?
        args[0] :
        Array.prototype.slice.call(args);
};

module.exports = (function() {

    // For now, just choosing the smallest value possible that ensures the test scheduler beings reporting time at a 0-based value
    const DEFAULT_START_TIME_MS = 9;
    const DEFAULT_TIME_STEP_MS = 1;
    const MAX_CHARS = 10000;
    const MAX_SEQUENCE_TIME = MAX_CHARS * DEFAULT_TIME_STEP_MS;
    // Wraps the resulting observable in a container so that we can easily chain operations
    let _wrap = function(seqStr) {
        let self = this;
        let obj = () => self.toString.bind(self);

        obj._seqStr = seqStr;
        obj._self = self;

        // Store methods so that we can easily support chaining
        for (let prop in self) {
            if (self.hasOwnProperty(prop)) {
                if ((typeof self[prop]) === 'function') {
                    obj[prop] = self[prop].bind(obj);
                }
                else {
                    obj[prop] = self[prop];
                }
            }
        }

        return obj;
    };

    let onNext = Rx.ReactiveTest.onNext;
    let onError = Rx.ReactiveTest.onError;
    let onCompleted = Rx.ReactiveTest.onCompleted;

    let strToGroupedList = function(str) {
        let tokens = str.split('');
        let listOfSets = [];
        let numNestedSets = 0;
        let currExpression = '';
        tokens.forEach(function(token) {
            switch(token) {
                case '(':
                case '{':
                    if (++numNestedSets === 1) {
                        currExpression = '';
                    }
                    break;
                case ')':
                case '}':
                    if (--numNestedSets === 0) {
                        listOfSets.push(currExpression + token);
                    }
                    break;
                default:
                    if (numNestedSets === 0) {
                        listOfSets.push(token);
                    }
                    break;
            }
            if (numNestedSets > 0) {
                currExpression += token;
            }
        });

        if (numNestedSets !== 0) {
            throw new Error('Rx string has unbalanced parens! => ' + str);
        }

        return listOfSets;
    };

    let strToObs = function(str, scheduler, props) {
        str = str || '';
        if (str.indexOf('|') === -1) {
            str = str + '|';
        }
        let listOfSets = strToGroupedList(str);
        let obsList = [];
        let obs;
        let delay = 0;

        listOfSets.forEach(function(token) {
            let skipMe = false;
            switch(token) {
                case ' ':
                case '-':
                case '.':
                    delay += DEFAULT_TIME_STEP_MS;
                    skipMe = true;
                    break;
                case '!':
                    delay += DEFAULT_TIME_STEP_MS;
                    obs = onError(delay, '!');
                    break;
                case '|':
                    obs = onCompleted(delay);
                    break;
                default:
                    delay += DEFAULT_TIME_STEP_MS;
                    if (token.charAt(0) === '{') {
                        token = JSON.parse(token);
                    }
                    obs = onNext(delay, token);
                    break;
            }

            if (!skipMe) {
                obsList.push(obs);
            }
        });

        return scheduler.createColdObservable( obsList );
    };

    let obsToStr = function(obs, scheduler, props) {
        let output = '';
        let results = scheduler.startWithTiming(function () {
            return obs;
        },
            //Use with startWithTiming
            0,
            DEFAULT_START_TIME_MS,
            MAX_SEQUENCE_TIME
        );
        let lastTime = DEFAULT_START_TIME_MS;
        let messages = results.messages;

        if (props.mostRecentOnly) {
            messages = _.uniq(messages.reverse(), function(message) {
                if (!message.value.value) {
                    return null;
                }
                return message.time;
            }).reverse();
        }

        let lastCharIndex = messages.length - 1;
        messages.forEach(function(message, idx) {
            let messageValue = message && message.value;
            let value = messageValue.value;
            let kind = messageValue.kind;

            if (kind === 'C' && (idx === lastCharIndex)) {
                // Hack to ensure onComplete gets positioned in the right place.
                message.time += DEFAULT_TIME_STEP_MS;
            }
            // Format multi-character values by wrapping them with parentheses
            if (value !== null && value !== undefined) {
                if (value.constructor === Array) {
                    // If value is an array, flatten it as a comma-delimited element (Ex: forkJoin())
                    value = '(' + value.join(',') + ')';
                }
                else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                // Convert other datatypes (boolean, numbers) to string values
                value = value.toString();
                if (value.length > 1 && ((value.charAt(0) !== '(') && value.charAt(value.length - 1) !== ')' &&
                                        (value.charAt(0) !== '{') && value.charAt(value.length - 1) !== '}' )) {
                    value = '(' + value + ')';
                }
            }
            let delta = (message.time - lastTime) / DEFAULT_TIME_STEP_MS;

            message.value.value = value;

            for(let j = 0; j < delta - 1; ++j) {
                output = output + '.';
            }

            lastTime = message.time;

            if (!value) {
                if (kind === 'N') {
                    // Convert unhandled values to '?'
                    value = '?';
                }
                else if (kind === 'E') {
                    // Convert unhandled values to '?'
                    value = '!';
                }
                else if (kind === 'C') {
                    // Terminate sequence
                    value = '|';
                }
                else {
                    throw new Error('obsToStr received unknown element type: ' + kind);
                }
            }
            output = output + value;
        });

        return output;
    };

    let transformArgument = function(testScheduler, props, elem) {
        // Convert string arguments to observable sequences
        // If argument is an object/function check whether it has a string property that should be converted as well
        elem = (elem && elem._seqStr) || elem;
        if (!props.argAsIs) {
            if (typeof elem === 'string') {
                if (props.numberArgAsTime) {
                    elem = elem.length * DEFAULT_TIME_STEP_MS;
                    props.numberArgAsTime = false;
                }
                else {
                    elem = strToObs( elem, testScheduler, props);
                }
            }
            else if (typeof elem === 'number') {
                if (props.numberArgAsTime) {
                    elem = elem * DEFAULT_TIME_STEP_MS;
                    props.numberArgAsTime = false;
                }
            }
        }
        return elem;
    };

    let colorizeOutput = function(obsStr) {
        if (obsStr) {
            let tokens = obsStr.split('');
            let colorFuncMap = {
                '.': clc.redBright,
                '|': clc.magentaBright,
                '!': clc.magentaBright
            };
            return tokens.map(elem =>
                (colorFuncMap[elem] || clc.cyanBright)(elem)
            ).join('');
        }
        return obsStr;
    };

    // General purpose combine method
    let combine = function(props) {
        let that = this._self || this;
        let rxOperationName = props.rxOperationName;
        let rxOperation;
        let args = arrayize(props.arguments);
        let obs = Rx.Observable;
        let obsStr;
        let hasStaticMethod = Boolean(Rx.Observable[rxOperationName]);
        let hasInstanceMethod = Boolean(Rx.Observable.prototype[rxOperationName]);
        let isInstanceMethodOnly = hasInstanceMethod && !hasStaticMethod;
        let seqStr = this && this._seqStr;

        // Create a test scheduler to convert the strings to observable sequences
        let testScheduler = new Rx.TestScheduler();

        // Check whether a custom combinator is provided
        if (props.combinator) {
            args.push(props.combinator);
        }

        // Whether test scheduler should be added as another argument
        if (props.addScheduler) {
            args.push(testScheduler);
        }

        let transformArgs = (!isInstanceMethodOnly || props.hasSequence);

        // Combine instance's value with other arguments
        if (isInstanceMethodOnly) {
            // Extract the stored sequence to support object-chaining
            obs = strToObs( seqStr, testScheduler, props);
            // Note: Some observable methods don't require arguments (e.g. sum)
        }
        else if (seqStr) {
            // We extract the stored sequence from both the observable and instance in order to support object chaining
            args.unshift(seqStr);
        }

        if (transformArgs) {
            args = args.map(transformArgument.bind(undefined, testScheduler, props));
        }

        rxOperation = obs[rxOperationName];

        obsStr = obsToStr(rxOperation.apply(obs, args), testScheduler, props);

        let obj = _wrap.call(that, obsStr);
        // Track operations for subsequent display() call
        let history = this._history && this._history.slice(0) || [];
        obj._history = history;
        obj._history.push({
            operation: props.rxOperationNameOriginal || rxOperationName,
            arguments: arrayize(props.arguments),
            output: obsStr
        });

        return obj;
    };

    let sumSelector = function(val) {
        return 1;
    };

    let defaultCombinator = function() {
        return '(' + Array.prototype.join.call(arguments, '') + ')';
    };

    let numberSelector = function(val) {
        val = val || '';
        val = _.trimLeft(val, '(');
        val = _.trimRight(val, ')');
        return Number(val);
    };

    let obj = {
        from: function() {
            let self = this;
            let args = arrayize(arguments);
            let str = args.join('');
            return _wrap.call(self, str);
        },
        return: function(val) {
            return Observable.return(val);
        },

        repeat: function(val, num) {
            let self = this;
            val = (val && val.toString()) || '';
            if (val.length > 1 && (val.charAt(0) !== '(') && val.charAt(val.length - 1) !== ')') {
                val = '(' + val + ')';
            }
            let str = _.repeat(val, num);
            return _wrap.call(self, str);
        },

        // TODO: Consider replacing code below with TestScheduler-created observable (then call subscribe)
        subscribe: function(onNext, onError, onCompleted) {
            let str = this._seqStr;
            if (str.indexOf('|') === -1) {
                str = str + '|';
            }
            let listOfSets = strToGroupedList(str);
            let skipRemaining = false;
            listOfSets.forEach(function(elem) {
                if (!skipRemaining) {
                    if (elem === '!') {
                        onError && onError(elem);
                    }
                    else if (elem === '|') {
                        onCompleted && onCompleted(elem);
                        skipRemaining = true;
                    }
                    else if (onNext) {
                        onNext(elem);
                    }
                }
            });
        },

        subscribeOnNext: function(onNext) {
            this.subscribe(onNext);
        },

        subscribeOnError: function(onError) {
            this.subscribe(null, onError);
        },

        subscribeOnCompleted: function(onCompleted) {
            this.subscribe(null, null, onCompleted);
        },

        toString: function() {
            return _.trimRight(this._seqStr, '|');
        },

        display: function() {
            let history = this._history;
            let operations = history.map(function (elem) {
                    return {
                        operation: clc.greenBright(elem.operation),
                        arguments: colorizeOutput(JSON.stringify(elem.arguments)),
                        output: colorizeOutput(elem.output)
                    };
                });

            console.log('\n' + columnify(operations, {
                columns: ['operation', 'arguments', 'output']
            }));

            return history;
        },

        toArray: function() {
            // Remove delays and termination elements
            let result = this._seqStr.replace(/[\|\.\!]+/g, '');
            return result.split('');
        }
    };

    let addFunction = function(opName, opProps) {
        let self = this;
        opProps = opProps || {};
        self[opName] = function() {
            return combine.call(this, extend({
                rxOperationName: opName,
                arguments: arguments
            }, opProps));
        };
    };
    addFunction = addFunction.bind(obj);

    [
        { name: 'amb' },
        { name: 'and' },
        { name: 'average', props: { combinator: numberSelector } },
        { name: 'bufferWithCount' },
        { name: 'bufferWithTime', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'catch' },
        { name: 'combineLatest', props: { mostRecentOnly: true, combinator: defaultCombinator } },
        { name: 'concat' },
        { name: 'count' },
        { name: 'debounce', props: { addScheduler: true } },
        { name: 'defaultIfEmpty' },
        { name: 'distinct' },
        { name: 'distinctUntilChanged' },
        { name: 'do' },
        { name: 'doOnCompleted' },
        { name: 'doOnError' },
        { name: 'doOnNext' },
        { name: 'doWhile' },
        { name: 'elementAt' },
        { name: 'empty' },
        { name: 'every' },
        { name: 'filter' },
        { name: 'finally' },
        { name: 'find' },
        { name: 'findIndex' },
        { name: 'first' },
        { name: 'flatMapLatest', props: { mostRecentOnly: true } },
        { name: 'for' },
        { name: 'forkJoin', props: { hasSequence: false } },
        { name: 'generate', props: { argAsIs: true } },
        { name: 'if' },
        { name: 'ignoreElements' },
        { name: 'isEmpty' },
        { name: 'interval', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'last' },
        { name: 'let' },
        { name: 'map' },
        { name: 'max' },
        { name: 'maxBy' },
        { name: 'merge' },
        { name: 'mergeDelayError' },
        { name: 'min' },
        { name: 'minBy' },
        { name: 'onErrorResumeNext' },
        { name: 'pairs' },
        { name: 'pairwise' },
        { name: 'partition' },
        { name: 'pluck' },
        { name: 'range' },
        { name: 'reduce' },
        { name: 'retry' },
        { name: 'scan' },
        { name: 'sample', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'selectMany' },
        { name: 'sequenceEqual', props: { hasSequence: true } },
        { name: 'skip' },
        { name: 'skipLast' },
        { name: 'skipLastWithTime', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'skipUntil', props: { hasSequence: true } },
        { name: 'skipUntilWithTime', props: { numberAsTime: true, addScheduler: true } },
        { name: 'skipWhile' },
        { name: 'some' },
        { name: 'start', props: { addScheduler: true } },
        { name: 'startWith' },
        { name: 'sum', props: { combinator: sumSelector } },
        { name: 'switch' },
        { name: 'take' },
        { name: 'takeLast' },
        { name: 'takeLastBuffer' },
        { name: 'takeLastBufferWithTime', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'takeLastWithTime', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'takeUntil', props: { hasSequence: true } },
        { name: 'takeUntilWithTime', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'takeWhile' },
        { name: 'throttle', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'timeout', props: { hasSequence: true, numberArgAsTime: true, addScheduler: true } },
        { name: 'timer', props: { numberArgAsTime: true, addScheduler: true } },
        { name: 'timestamp', props: { addScheduler: true } },
        { name: 'timeInterval', props: { addScheduler: true } },
        { name: 'while' },
        { name: 'windowWithCount', props: { argAsIs: true } },
        { name: 'zip', props: { combinator: defaultCombinator } }

    ].forEach(
        opConfig => addFunction(opConfig.name, opConfig.props)
    );

    obj['addFunction'] = addFunction;

    // Aliases
    obj['flatMap'] = obj['selectMany'];
    obj['select'] = obj['map'];
    obj['of'] = obj['from'];
    obj['forEach'] = obj['subscribe'];

    obj['just'] = obj['from'];
    obj['returnValue'] = obj['return'];

    obj['where'] = obj['filter'];
    obj['tap'] = obj['do'];
    obj['tapOnNext'] = obj['doOnNext'];
    obj['tapOnError'] = obj['doOnError'];
    obj['tapOnCompleted'] = obj['doOnCompleted'];

    // delay is essentially just a startWith() with a specified time period
    obj['delay'] = function(val) {
        if (typeof val === 'string') {
            val = val.length;
        }
        val = _.fill(Array(val), '.').join('');

        return combine.call(this, extend({
            rxOperationName: 'startWith',
            rxOperationNameOriginal: 'delay',
            arguments: val
        }, {
            isInstanceMethodOnly: true
        } ));
    };

    return obj;

})();
