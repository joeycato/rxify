var should = require('chai').should(),
    rxify = require('../es5/index');
    rx = require('Rx');

describe('#amb', function() {
    it('handles basic operation #1', function() {
        var seq = ['..3...','....4','1...'];
        rxify.amb(seq).toString().should.equal('1...');
    });
    it('handles basic operation #2', function() {
        var a = '..3...';
        var b = '....4';
        var c = '1...';
        rxify.amb(rxify.of(a), rxify.of(b), rxify.of(c)).toString().should.equal('1...');
    });
});

describe('#average', function() {
    it('handles basic operation', function() {
        rxify.from('123').average().toString().should.equal('..2');
        rxify.from('(10)(20)(30)').average().toString().should.equal('..(20)');
        rxify.from('1..2..3').average().toString().should.equal('......2');
        rxify.from('(10)..(20)....(30)').average().toString().should.equal('........(20)');
    });
});

describe('#bufferWithCount', function() {
    it('handles basic operation', function() {
        rxify.from('abc').bufferWithCount(2).toString().should.equal('.(a,b)(c)');
        rxify.from('a...bc').bufferWithCount(2).toString().should.equal('....(a,b)(c)');
        rxify.from('0123456789abcdefghijklmnopq').bufferWithCount(4).toString().should.equal('...(0,1,2,3)...(4,5,6,7)...(8,9,a,b)...(c,d,e,f)...(g,h,i,j)...(k,l,m,n)..(o,p,q)');
    });
});

describe('#bufferWithTime', function() {
    it('handles basic operation', function() {
        rxify.interval(1).bufferWithTime(5,1).take(3).toString().should.equal('....(0,1,2,3,4)(0,1,2,3,4,5)(2,3,4,5,6)');
    });
});

describe('#catch', function() {
    it('handles basic operation', function() {
        var seq = ['..3!.9','1...4'];
        rxify.catch(seq[0], seq[1]).toString().should.equal('..3.1...4');
        rxify.from(seq[0]).catch(seq[1]).toString().should.equal('..3.1...4');
        rxify.catch(seq).toString().should.equal('..3.1...4');
    });
});

describe('#combineLatest', function() {
    var seqa = 'A...B.....C';
    var seqb = '..1...2.3..';
    var seqc = 'x....y....z';
    var op = rxify.combineLatest.bind(rxify);
    var from = rxify.from.bind(rxify);
    var chunk1 = from(seqa);
    var chunk2 = from(seqb);
    var chunk3 = from(seqc);
    var expected = '..(A1x).(B1x)(B1y)(B2y).(B3y).(C3z)';

    // Run twice to ensure objects aren't unexpectedly mutated
    [1,2].forEach(function(idx) {
        it('handles an array of strings', function() {
            op(seqa,seqb,seqc).toString().should.equal(expected);
        });
        it('handles an array of strings of varying length (padded)', function() {
            op(seqa,seqb + '......' ,seqc).toString().should.equal(expected + '......');
            op(seqa,seqb,seqc + '..').toString().should.equal(expected + '..');
        });

        it('handles an object chain', function() {
            from(seqa).zip(seqb).zip(seqc).toString().should.equal('..((A1)x)...((B2)y)...((C3)z)');
        });

        it('handles an array of objects', function() {
            op(chunk1,chunk2,chunk3).toString().should.equal(expected);
        });

        it('handles an array of mixed types', function() {
            [
                op(chunk1,chunk2,chunk3).toString(),
                op(seqa,chunk2,chunk3).toString(),
                op(chunk1,seqb,chunk3).toString(),
                op(chunk1,chunk2,seqc).toString(),
                op(seqa,chunk2,seqc).toString(),

            ].forEach(function(elem) {
                elem.should.equal(expected);
            });
        });
     });
});

describe('#concat', function() {
    var seqa = '.abc';
    var seqb = '.def';
    var seqc = '1ghi.';
    var op = rxify.concat.bind(rxify);
    var from = rxify.from.bind(rxify);
    var chunk1 = from(seqa);
    var chunk2 = from(seqb);
    var chunk3 = from(seqc);
    var expected = seqa + seqb + seqc;

    // Run twice to ensure objects aren't unexpectedly mutated
    [1,2].forEach(function(idx) {
        it('handles an array of strings', function() {
            op(seqa,seqb,seqc).toString().should.equal(expected);
        });

        it('handles an array of strings of varying length (padded)', function() {
            op(seqa,seqb + '......' ,seqc).toString().should.equal(seqa + seqb + '......' + seqc);
            op(seqa,seqb,seqc + '..').toString().should.equal(expected + '..');
        });

        it('handles an object chain', function() {
            op(seqa).concat(seqb).concat(seqc).toString().should.equal(expected);
        });

        it('handles an object chain', function() {
            op(seqa).concat(seqb).concat(seqc).toString().should.equal(expected);
        });

        it('handles an array of objects', function() {
            op(chunk1,chunk2,chunk3).toString().should.equal(expected);
        });

        it('handles an array of mixed types', function() {
            [
                op(chunk1,chunk2,chunk3).toString(),
                op(seqa,chunk2,chunk3).toString(),
                op(chunk1,seqb,chunk3).toString(),
                op(chunk1,chunk2,seqc).toString(),
                op(seqa,chunk2,seqc).toString(),

            ].forEach(function(elem) {
                elem.should.equal(expected);
            });
        });
    });
});

describe('#count', function() {
    var seq =      '123456789999';
    it('handles basic operation', function() {
        rxify.from(seq).count(function(elem) {
            return elem % 2 == 0;
        }).toString().should.equal('...........4');
    });
    it('handles basic operation', function() {
        rxify.from(seq).count().toString().should.equal('...........(12)');
    });
});

describe('#debounce', function() {
    it('handles basic operation', function() {
        var input = 'AA..BBB..CCCC...DDDD...EEEEEE..FFFFF..GGGGG';
        rxify.of(input).debounce(1).toString().should.equal('..A....B.....C......D........E......F.....G');
        rxify.of(input).debounce(4).toString().should.equal('..........................................G');
        input = 'ABC.ABC.ABC.ABC.ABC.ABC.';
        rxify.of(input).debounce(4).toString().should.equal('.......................C');
    });
});

describe('#defaultIfEmpty', function() {
    it('handles basic operation', function() {
        rxify.empty().defaultIfEmpty().toString().should.equal('?');
        rxify.empty().defaultIfEmpty('X').toString().should.equal('X');
        rxify.from('ABC').defaultIfEmpty('X').toString().should.equal('ABC');
        rxify.from('....A...BC').defaultIfEmpty('X').toString().should.equal('....A...BC');
        rxify.from('...').defaultIfEmpty('Y').toString().should.equal('..Y');
    });
});

describe('#delay', function() {
    var seqa = 'ABC';
    var expected = '...ABC';

    it('handles basic operation of number arg', function() {
        rxify.from(seqa).delay(3).toString().should.equal(expected);
    });
    it('handles basic operation of string arg', function() {
        rxify.from(seqa).delay('---').toString().should.equal(expected);
    });
    it('handles basic operation of string arg (2)', function() {
        rxify.from(seqa).delay('A-B').toString().should.equal(expected);
    });
});

describe('#distinct', function() {
    var seq =      '..A.A..B..A..C';
    var expected = '..A....B.....C';
    it('handles basic operation', function() {
        rxify.from(seq).distinct().toString().should.equal(expected);
    });
    it('handles function arg', function() {
        rxify.from(seq).distinct(function(elem) {
            return elem;
        }).toString().should.equal(expected);
    });
});

describe('#distinctUntilChanged', function() {
    var seq =      '..A.A..B..A..C';
    var expected = '..A....B..A..C';
    it('handles basic operation', function() {
        rxify.from(seq).distinctUntilChanged().toString().should.equal(expected);
    });
    it('handles function arg', function() {
        rxify.from(seq).distinctUntilChanged(function(elem) {
            return elem;
        }).toString().should.equal(expected);
    });
});

describe('#do/#tap', function() {
    [ 'do', 'tap' ].forEach( function (rxOpName) {
        it('handles basic operation', function() {
            var seq = '1001110101110101';
            var num_ones = 0;
            var obs = rxify.from(seq);
            obs[rxOpName](function(elem) {
                if (elem === '1') {
                    num_ones++;
                }
            });
            num_ones.should.equal(10);
            obs.toString().should.equal('1001110101110101');
        });
    });
});

describe('#doOnCompleted/#tapOnCompleted', function() {
    it('handles basic operation', function() {
        var numCalls = 0;
        var result = rxify.from('a..b..c....d').doOnCompleted(function(val) {
            ++numCalls;
        }).toString().should.equal('a..b..c....d');
        numCalls.should.equal(1);
    });
});

describe('#doOnError/#tapOnError', function() {
    it('handles basic operation', function() {
        var list = [];
        var result = rxify.from('a..b..!....d').doOnError(function(val) {
            list.push(val.toUpperCase());
        }).toString().should.equal('a..b..!');
        list.join('').should.equal('!');
    });
});

describe('#doOnNext/#tapOnNext', function() {
    it('handles basic operation', function() {
        var list = [];
        var result = rxify.from('a..b..c....d').doOnNext(function(val) {
            list.push(val.toUpperCase());
        }).toString().should.equal('a..b..c....d');
        list.join('').should.equal('ABCD');
    });
});

describe('#doWhile', function() {
    it('handles basic operation', function() {
        var i = 0;
        rxify.from('Aa.').doWhile(function(){ return ++i <= 4; }).toString().should.equal('Aa.Aa.Aa.Aa.Aa.');
        rxify.from('xyz').doWhile(function(){ return false; }).toString().should.equal('xyz');
    });
});

describe('#elementAt', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).elementAt(3).toString().should.equal('...D');
    });
    it('handles basic operation', function() {
        rxify.from(seq).elementAt(99,'X').toString().should.equal('..........X');
    });
});

describe('#empty', function() {
    it('handles basic operation', function() {
        rxify.empty().toString().should.equal('');
    });
});

describe('#every', function() {
    it('handles basic operation', function() {
        var seq = '7..7..7..7...7...77.';
        rxify.from(seq).every(function (elem) {
            return elem === '7';
        }).toString().should.equal('...................(true)');
    });
    it('handles basic operation', function() {
        var seq = '7..7..7..7...7...77.';
        rxify.from(seq).every(function (elem) {
            return elem === '8';
        }).toString().should.equal('(false)');
    });
});

describe('#filter', function() {
    var seq =      '123456789';
    it('handles basic operation', function() {
        rxify.from(seq).filter(function(elem) {
            return elem % 2 == 0;
        }).toString().should.equal('.2.4.6.8.');
    });
});

describe('#finally', function() {
    it('handles basic operation', function(done) {
        rxify.from('abc').count().finally(function() { done(); } ).toString().should.equal('..3');
    });
    it('handles basic operation - error', function(done) {
        rxify.from('abc!def').count().finally(function() { done(); } ).toString().should.equal('...!');
    });
    it('handles basic operation - silence', function(done) {
        rxify.from('....').count().finally(function() { done(); } ).toString().should.equal('...0');
    });
});

describe('#find', function() {
    var seq = '12345ABC';
    it('handles basic operation #1', function() {
        rxify.from(seq).find(function(elem) {
            return elem === 'A';
        }).toString().should.equal('.....A');
    });
    it('handles basic operation #2', function() {
        rxify.from(seq).find(function(elem) {
            return elem === 'X';
        }).toString().should.equal('.......?');
    });
});

describe('#findIndex', function() {
    var seq = '12345ABC';
    var expected = '.....5';
    it('handles basic operation', function() {
        rxify.from(seq).findIndex(function(elem) {
            return elem === 'A';
        }).toString().should.equal(expected);
    });
    it('handles basic operation', function() {
        rxify.from(seq).findIndex(function(elem) {
            return elem === 'X';
        }).toString().should.equal('.......(-1)');
    });
});


describe('#first', function() {
    var seq = 'ABCDEFGHIJKLMJ';
    var obs = rxify.from(seq);
    var func = obs.first.bind(obs);

    it('handles basic operation - no args', function() {
        func().toString().should.equal('A');
    });
    it('handles basic operation - single arg predicate', function() {
        func(function(elem) {
            return elem === 'J';
        }).toString().should.equal('.........J');
    });
    it('handles basic operation - multiple args', function() {
        func(function(elem) {
            return elem === 'X';
        },null,'Z').toString().should.equal('.............Z');
    });
    it('handles basic operation - config arg', function() {
        var cfg = {
            predicate: function(elem) {
                return elem === 'X';
            },
            defaultValue: 'W'
        };
        func(cfg).toString().should.equal('.............W');
    });
});

describe('#flatMapLatest', function() {
    it('handles basic operation', function() {
        var i = 0;
        rxify.from('a.b.c').flatMapLatest(function(elem) {
            return elem + '....' + (i++);
        }).toString().should.equal('0.1.2');
    });
});

describe('#forkJoin', function() {
    it('handles basic operation', function() {
        rxify.from('abc').forkJoin('def').toString().should.equal('..(c,f)');
        rxify.forkJoin('abc', 'def').toString().should.equal('..(c,f)');
        rxify.forkJoin(['abc', 'def']).toString().should.equal('..(c,f)');
        rxify.forkJoin('abc', 'def').forkJoin('xyz').toString().should.equal('..((c,f),z)');
        rxify.forkJoin('a!c', 'def').toString().should.equal('.!');
    });
});

describe('#from', function() {
    it('handles basic operation', function() {
        rxify.from('abcd').toString().should.equal('abcd');
        rxify.from(['a','b','c','d']).toString().should.equal('abcd');
        rxify.from('...abcd').toString().should.equal('...abcd');
        rxify.from('abcd...').toString().should.equal('abcd...');
        rxify.from('a').toString().should.equal('a');
        rxify.from('.').toString().should.equal('.');
        rxify.from('').toString().should.equal('');
    });
});

describe('#generate', function() {
    it('handles basic operation - numbers', function() {
        rxify.generate(0,
            function (x) { return x < 3; },
            function (x) { return x + 1; },
            function (x) { return x; }).toString().should.equal('012');
    });
    it('handles basic operation - letters', function() {
        var msg = 'hello';
        rxify.generate(0,
            function (x) { return x < msg.length; },
            function (x) { return x + 1; },
            function (x) { return msg.charAt(x); }).toString().should.equal('hello');
    });
});

describe('#if', function() {
    it('handles basic operation - true', function() {
        var fn = function() {
            return true;
        };
        rxify.if(fn,'abc','def').toString().should.equal('abc');
    });
    flag = false;
    it('handles basic operation - false', function() {
        var fn = function() {
            return false;
        };
        rxify.if(fn,'abc','def').toString().should.equal('def');
    });

});

describe('#ignoreElements', function() {
    it('handles basic operation', function() {
        rxify.from('abcd').ignoreElements().toString().should.equal('....');
        rxify.from('...abcd').ignoreElements().toString().should.equal('.......');
        rxify.from('abc!').ignoreElements().toString().should.equal('...!');
        rxify.from('').ignoreElements().toString().should.equal('.');
        rxify.from('|').ignoreElements().toString().should.equal('.');
        rxify.from('!').ignoreElements().toString().should.equal('!');
    });
});

describe('#interval', function() {
    it('handles basic operation', function() {
        rxify.interval(4).timeInterval().take(3).toString().should.equal('...{"value":"0","interval":4}...{"value":"1","interval":4}...{"value":"2","interval":4}');
        rxify.interval(1).take(5).toString().should.equal('01234');
    });
});

describe('#isEmpty', function() {
    it('handles basic operation', function() {
        rxify.from('....abcd').isEmpty().toString().should.equal('....(false)');
        rxify.from('abcd').isEmpty().toString().should.equal('(false)');
        rxify.from('a').isEmpty().toString().should.equal('(false)');
        rxify.from('!').isEmpty().toString().should.equal('!');
        rxify.from('|').isEmpty().toString().should.equal('(true)');
    });
});

describe('#just', function() {
    it('handles basic operation', function() {
        rxify.just('a').toString().should.equal('a');
        rxify.just(['a']).toString().should.equal('a');
        rxify.just('.').toString().should.equal('.');
        rxify.just('').toString().should.equal('');
    });
});

describe('#last', function() {
    var seq = 'ABCDEFGHIJKLMJ9';
    var obs = rxify.from(seq);
    var func = obs.last.bind(obs);

    it('handles basic operation - no args', function() {
        func().toString().should.equal('..............9');
    });
    it('handles basic operation - single arg predicate', function() {
        func(function(elem) {
            return elem === 'J';
        }).toString().should.equal('..............J');
    });
    it('handles basic operation - multiple args', function() {
        func(function(elem) {
            return elem === 'X';
        },null,'Z').toString().should.equal('..............Z');
    });
    it('handles basic operation - config arg', function() {
        var cfg = {
            predicate: function(elem) {
                return elem === 'X';
            },
            defaultValue: 'W'
        };
        func(cfg).toString().should.equal('..............W');
    });
});

describe('#let', function() {
    it('handles basic operation', function() {
        rxify.from('1.23').let(function(o) { return o.concat(o); }).toString().should.equal('1.231.23');
    });
});

describe('#map', function() {
    var seq =      '1234567';
    it('handles basic operation', function() {
        rxify.from(seq).map(function(elem) {
            return Number(elem) + 1;
        }).toString().should.equal('2345678');
    });
    it('handles basic operation', function() {
        rxify.from(seq).map(function(elem) {
            return 'x';
        }).toString().should.equal('xxxxxxx');
    });
    it('handles basic operation with silence', function() {
        seq = 'A..B...C..';
        rxify.from(seq).map(function(elem) {
            return 'x';
        }).toString().should.equal('x..x...x..');
    });
});

describe('#merge', function() {
    var seqa = '.abc';
    var seqb = '.def...'; // BUG: Add trailing dots here...not filling in properly!
    var seqc = '1ghi';
    var op = rxify.merge.bind(rxify);
    var chunk1 = op(seqa);
    var chunk2 = op(seqb);
    var chunk3 = op(seqc);
    [1,2].forEach(function(idx) {
        it('handles an array of strings', function() {
            op(seqa,seqb,seqc).toString().should.equal('1adgbehcfi...');
        });

        it('handles an array of strings of varying length (padded)', function() {
            op(seqa,seqb + '......' ,seqc).toString().should.equal('1adgbehcfi.........');
            op(seqa,seqb ,seqc + '..').toString().should.equal('1adgbehcfi...');
        });

        it('handles an object chain', function() {
            op(seqa).merge(seqb).merge(seqc).toString().should.equal('1agdhbiecf...');
        });

        it('handles duplicated toString c alls', function() {
            var result1 = op(seqa);
            result1.toString().should.equal('.abc');
            result1.toString().should.equal('.abc');
            var result2 = result1.merge(seqb);
            result1.toString().should.equal('.abc');
            result1.toString().should.equal('.abc');
            result2.toString().should.equal('.adbecf...');
            result2.toString().should.equal('.adbecf...');
            var result3 = result2.merge(seqc);
            result3.toString().should.equal('1agdhbiecf...');
        });

        it('handles an object chain', function() {
            op(seqa).merge(seqb).merge(seqc).toString().should.equal('1agdhbiecf...');
        });

        it('handles an array of objects', function() {
            op(chunk1,chunk2,chunk3).toString().should.equal('1adgbehcfi...');
        });

        it('handles an array of mixed types', function() {
            [
                op(chunk1,chunk2,chunk3).toString(),
                op(seqa,chunk2,chunk3).toString(),
                op(chunk1,seqb,chunk3).toString(),
                op(chunk1,chunk2,seqc).toString(),
                op(seqa,chunk2,seqc).toString(),

            ].forEach(function(elem) {
                elem.should.equal('1adgbehcfi...');
            });
        });

        it('handles an array of strings with errors', function() {
            op('.abc','.d!f','1ghi').toString().should.equal('1adgb!');
        });
    });

});

describe('#mergeDelayError', function() {
    var seqa = '.abc';
    var seqb = '.def...'; // BUG: Add trailing dots here...not filling in properly!
    var seqc = '1ghi';
    var op = rxify.mergeDelayError.bind(rxify);
    var chunk1 = op(seqa);
    var chunk2 = op(seqb);
    var chunk3 = op(seqc);
    [1,2].forEach(function(idx) {
        it('handles an array of strings', function() {
            op(seqa,seqb,seqc).toString().should.equal('1adgbehcfi...');
        });

        it('handles an array of strings of varying length (padded)', function() {
            op(seqa,seqb + '......' ,seqc).toString().should.equal('1adgbehcfi.........');
            op(seqa,seqb ,seqc + '..').toString().should.equal('1adgbehcfi...');
        });

        it('handles an object chain', function() {
            op(seqa).mergeDelayError(seqb).mergeDelayError(seqc).toString().should.equal('1agdhbiecf...');
        });

        it('handles duplicated toString c alls', function() {
            var result1 = op(seqa);
            result1.toString().should.equal('.abc');
            result1.toString().should.equal('.abc');
            var result2 = result1.mergeDelayError(seqb);
            result1.toString().should.equal('.abc');
            result1.toString().should.equal('.abc');
            result2.toString().should.equal('.adbecf...');
            result2.toString().should.equal('.adbecf...');
            var result3 = result2.mergeDelayError(seqc);
            result3.toString().should.equal('1agdhbiecf...');
        });

        it('handles an object chain', function() {
            op(seqa).mergeDelayError(seqb).mergeDelayError(seqc).toString().should.equal('1agdhbiecf...');
        });

        it('handles an array of objects', function() {
            op(chunk1,chunk2,chunk3).toString().should.equal('1adgbehcfi...');
        });

        it('handles an array of mixed types', function() {
            [
                op(chunk1,chunk2,chunk3).toString(),
                op(seqa,chunk2,chunk3).toString(),
                op(chunk1,seqb,chunk3).toString(),
                op(chunk1,chunk2,seqc).toString(),
                op(seqa,chunk2,seqc).toString(),

            ].forEach(function(elem) {
                elem.should.equal('1adgbehcfi...');
            });
        });

        it('handles an array of strings with errors', function() {
            op('.abc','.d!f','1ghi').toString().should.equal('1adgbhci!');
        });
    });

});

describe('#min/#max', function() {
    var seq = '2.JZ..1...0.11.';
    it('handles basic operation - min', function() {
        rxify.from(seq).min().toString().should.equal('..............0');
    });
    it('handles basic operation - max', function() {
        rxify.from(seq).max().toString().should.equal('..............Z');
    });
});

describe('#maxBy / #minBy', function() {
    it('handles basic operation - max', function() {
        rxify.from('1357924689').maxBy(function(elem) { return elem; }).toString().should.equal('.........(9,9)');
    });
    it('handles basic operation - min', function() {
        rxify.from('1357924681').minBy(function(elem) { return elem; }).toString().should.equal('.........(1,1)');
    });
});

describe('#of', function() {
    it('handles basic operation', function() {
        rxify.of('abcd').toString().should.equal('abcd');
        rxify.of(['a','b','c','d']).toString().should.equal('abcd');
        rxify.of('...abcd').toString().should.equal('...abcd');
        rxify.of('abcd...').toString().should.equal('abcd...');
        rxify.of('abc!d...').toString().should.equal('abc!d...');
        rxify.of('a').toString().should.equal('a');
        rxify.of('.').toString().should.equal('.');
        rxify.of('').toString().should.equal('');
    });
});

describe('#onErrorResumeNext', function() {
    it('handles basic operation', function() {
        rxify.from('abcdef').onErrorResumeNext('ghi').toString().should.equal('abcdefghi');
        rxify.from('ab!def').onErrorResumeNext('ghi').toString().should.equal('ab.ghi');
        rxify.from('..!..a').onErrorResumeNext('b').onErrorResumeNext('c..!..d').onErrorResumeNext('e').toString().should.equal('...bc...e');
        rxify.onErrorResumeNext('ab!def','ghi').toString().should.equal('ab.ghi');
        rxify.onErrorResumeNext('..!..a','b','c..!..d','e').toString().should.equal('...bc...e');
    });
});

describe('#pairs', function() {
    it('handles basic operation', function() {
        rxify.pairs({a:10,b:33,Z:1988}).toString().should.equal('(a,10)(b,33)(Z,1988)');
    });
});

describe('#pairwise', function() {
    it('handles basic operation', function() {
        rxify.from('abcdef').pairwise().toString().should.equal('.(a,b)(b,c)(c,d)(d,e)(e,f)');
        rxify.from('a').pairwise().toString().should.equal('.');
        rxify.from('ab').pairwise().toString().should.equal('.(a,b)');
        rxify.from('ab!c').pairwise().toString().should.equal('.(a,b)!');
    });
});

describe('#pluck', function() {
    it('handles basic operation', function() {
        rxify.timer(8,4).timeInterval().pluck('interval').take(2).toString().should.equal('.......8...4');
        rxify.interval(4).timeInterval().pluck('value').take(3).toString().should.equal('...0...1...2');
    });
});

describe('#range', function() {
    it('handles basic operation', function() {
        rxify.range(0,8).toString().should.equal('01234567');
    });
});

describe('#reduce', function() {
    var seq =      '123456789';
    it('handles basic operation', function() {
        rxify.from(seq).reduce(function(acc) {
            return Number(acc) + 1;
        }).toString().should.equal('........9');
    }, 0);
});

describe('#repeat', function() {
    it('handles basic operation', function() {
        rxify.repeat(1,3).toString().should.equal('111');
        rxify.repeat('a',4).toString().should.equal('aaaa');
        rxify.repeat(42,3).toString().should.equal('(42)(42)(42)');
    });
});

describe('#retry', function() {
    it('handles basic operation', function() {
        rxify.from('abc!').retry(3).toString().should.equal('abc.abc.abc!');
        rxify.from('abc!').retry(3).take(1).toString().should.equal('a');
    });
});

describe('#return', function(done) {
    it('handles basic operation', function() {
        var val = rxify.return('Q');
        rxify.concat('abc',val).toString().should.equal('abcQ');
        val = rxify.return('QWERT');
        rxify.concat('abc',val).toString().should.equal('abc(QWERT)');
    });
});

describe('#returnValue', function() {
    it('handles basic operation', function() {
        var val = rxify.returnValue('Q');
        rxify.concat('abc',val).toString().should.equal('abcQ');
        val = rxify.returnValue('QWERT');
        rxify.concat('abc',val).toString().should.equal('abc(QWERT)');
    });
});

describe('#scan', function() {
    it('handles basic operation', function() {
        rxify.range(1,3).scan(function (acc,x,i,source) { return Number(acc) + Number(x); }).toString().should.equal('136');
        rxify.from('1.2...3....4').scan(function (acc,x,i,source) { return Number(acc) + Number(x); }).toString().should.equal('1.3...6....(10)');
    });
});

describe('#select', function() {
    var seq =      '1234567';
    it('handles basic operation', function() {
        rxify.from(seq).select(function(elem) {
            return Number(elem) + 1;
        }).toString().should.equal('2345678');
    });
    it('handles basic operation', function() {
        rxify.from(seq).select(function(elem) {
            return 'x';
        }).toString().should.equal('xxxxxxx');
    });
    it('handles basic operation with silence', function() {
        seq = 'A..B...C..';
        rxify.from(seq).select(function(elem) {
            return 'x';
        }).toString().should.equal('x..x...x..');
    });
});

describe('#selectMany / #flatMap', function() {
    [ 'selectMany', 'flatMap' ].forEach( function (rxOpName) {
            //obs[rxOpName](function(elem) {
        var seq =      '1234567';
        it('handles basic operation', function() {
            rxify.from(seq)[rxOpName](function(elem) {
                // Note: You must return a string here...
                return (Number(elem) + 1).toString();
            }).toString().should.equal('2345678');
        });
        it('handles basic operation - 2', function() {
            rxify.from(seq)[rxOpName](function(elem) {
                return 'x';
            }).toString().should.equal('xxxxxxx');
        });
        it('handles basic operation with silence', function() {
            seq = 'A..B...C..';
            rxify.from(seq)[rxOpName](function(elem) {
                return 'x';
            }).toString().should.equal('x..x...x..');
        });
    });
});


describe('#sequenceEqual', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).sequenceEqual('ABC').toString().should.equal('...(false)');
    });
    it('handles basic operation', function() {
        rxify.from(seq).sequenceEqual('ABCDEFGHIJK').toString().should.equal('..........(true)');
    });
    it('handles basic operation', function() {
        rxify.from(seq).sequenceEqual('ABCDEFGHIJK...').toString().should.equal('.............(true)');
    });
});

describe('#skip', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).skip(3).toString().should.equal('...DEFGHIJK');
    });
});

describe('#skipLast', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).skipLast(3).toString().should.equal('...ABCDEFGH');
    });
});

describe('#skipLastWithTime', function() {
    it('handles basic operation', function() {
        rxify.timer(0, 1).take(10).skipLastWithTime(5).toString().should.equal('.....01234');
    });
});


describe('#skipUntil', function() {
    it('handles basic operation', function() {
        rxify.from('a..b...c..').skipUntil('....x').toString().should.equal('.......c..');
    });
});

describe('#skipUntilWithTime', function() {
    it('handles basic operation', function() {
        rxify.timer(0, 1).skipUntilWithTime(5).take(5).toString().should.equal('....45678');
        rxify.from('a.b.c.d.e').skipUntilWithTime(5).toString().should.equal('....c.d.e');
    });
});

describe('#skipWhile', function() {
    it('handles basic operation', function() {
        rxify.range(1,5).skipWhile(function (x) { return x < 3; }).toString().should.equal('..345');
    });
});

describe('#some', function() {
    it('handles basic operation', function() {
        var seq = '0..2..3...Z.11';
        rxify.from(seq).some(function (elem) {
            return elem === '3';
        }).toString().should.equal('......(true)');
    });
    it('handles basic operation #2', function() {
        var seq = '0..2..3...Z.11';
        rxify.from(seq).some(function (elem) {
            return elem === '9';
        }).toString().should.equal('.............(false)');
    });
});

describe('#start', function() {
    it('handles basic operation', function() {
        var context = { value: 42 };
        rxify.start(
            function() { return this.value; },
            context ).toString().should.equal('(42)');
    });
});

describe('#startWith', function() {
    var seqa = 'ABC';
    var expected = '123ABC';
    it('handles basic operation', function() {
        rxify.from(seqa).startWith('1','2','3').toString().should.equal(expected);
    });
});

describe('#subscribe', function() {
    var idx = 0;
    var seq = 'abcd!efg';
    var numNexts = 0;
    var numErrors = 0;
    var numCompleted = 0;
    it('handles basic operation', function(done) {
        // TODO: Test observer arg
        rxify.from(seq).subscribe(function onNext(val) {
           numNexts++;
           val.should.equal(seq[idx++]);
        }, function onError(e) {
           numErrors++;
           e.should.equal(seq[idx++]);
        }, function onCompleted(c) {
           numCompleted++;
           c.should.equal('|');

           numNexts.should.equal(7);
           numErrors.should.equal(1);
           numCompleted.should.equal(1);

           done();
        });
    });
});

describe('#subscribe (nested sets) ', function() {
    var idx = 0;
    var seq = 'abcd!efg';
    var numNexts = 0;
    var numErrors = 0;
    var numCompleted = 0;

    it('handles basic operation of nested sets', function(done) {
        seq = 'ab(cd)!efg';
        rxify.from(seq).subscribe(function onNext(val) {
           numNexts++;
        }, function onError(e) {
           numErrors++;
        }, function onCompleted(c) {
           numCompleted++;

           numNexts.should.equal(6);
           numErrors.should.equal(1);
           numCompleted.should.equal(1);
           done();
        });
    });

});

describe('#sum', function() {
    var seq = '0..1..1...1.11';
    it('handles basic operation - no args', function() {
        rxify.from(seq).sum().toString().should.equal('.............6');
    });
    it('handles basic operation - function arg', function() {
        rxify.from(seq).sum(function() {
            return 2;
        }).toString().should.equal('.............(12)');
    });
});

describe('#take', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).take(3).toString().should.equal('ABC');
    });
});

describe('#takeLast', function() {
    var seq =      'ABCDEFGHIJK';
    it('handles basic operation', function() {
        rxify.from(seq).takeLast(3).toString().should.equal('..........IJK');
    });
});

describe('#takeLastBuffer', function() {
    it('handles basic operation', function() {
        rxify.from('a..b.....c').takeLastBuffer(3).toString().should.equal('.........(a,b,c)');
    });
});

describe('#takeLastBufferWithTime', function() {
    it('handles basic operation', function() {
        rxify.from('a..b.....c').takeLastBufferWithTime(3).toString().should.equal('.........(c)');
        rxify.from('a.b.c.d').takeLastBufferWithTime(4).toString().should.equal('......(c,d)');
    });
});

describe('#takeLastWithTime', function() {
    it('handles basic operation', function() {
        rxify.timer(0,1).take(10).takeLastWithTime(5).toString().should.equal('.........56789');
    });
});

describe('#takeUntil', function() {
    var seq = 'ABCDEFGH';
    var obs = rxify.from(seq);
    it('handles argument sequence', function() {
        obs.takeUntil('..x').toString().should.equal('ABC');
    });
    it('handles argument sequence (single event)', function() {
        obs.takeUntil('x').toString().should.equal('A');
    });

    it('handles argument sequence (delay)', function() {
        obs.takeUntil('.').toString().should.equal('ABCDEFGH');
    });
});

describe('#takeUntilWithTime', function() {
    it('handles basic operation', function() {
        rxify.timer(0,1).takeUntilWithTime(5).toString().should.equal('0123.');
    });
});

describe('#takeWhile', function() {
    var seq = '123456789';
    var obs = rxify.from(seq);
    it('handles argument sequence', function() {
        obs.takeWhile(function(elem) {
            return elem < 4;
        }).toString().should.equal('123.');
    });
});

describe('#timeout', function() {
    [1,10].forEach(function(idx) {
        it('handles basic operation', function() {
            rxify.from('a........z').timeout(4,'def').toString().should.equal('a....def');
        });
    });
});

describe('#timer', function() {
    it('handles basic operation', function() {
        rxify.timer(8,4).timeInterval().pluck('interval').take(2).toString().should.equal('.......8...4');
        rxify.timer(1,1).timeInterval().pluck('interval').take(2).toString().should.equal('11');
    });
});

describe('#timeInterval', function() {
    it('handles basic operation', function() {
        var formatTime = function(elem) { return elem.value + ':' + elem.interval; };
        rxify.from('a...b....c..').timeInterval().map(formatTime).toString().should.equal('(a:1)...(b:4)....(c:5)..');
        rxify.from('abc..').timeInterval().map(formatTime).toString().should.equal('(a:1)(b:1)(c:1)..');
    });
});

describe('#timestamp', function() {
    it('handles basic operation', function() {
        var formatTime = function(elem) { return elem.value + ':' + elem.timestamp; };
        rxify.from('abc').timestamp().map(formatTime).toString().should.equal('(a:10)(b:11)(c:12)');
        rxify.from('a...b....c..').timestamp().map(formatTime).toString().should.equal('(a:10)...(b:14)....(c:19)..');
    });
});

describe('#toArray', function() {
    it('handles basic operation', function() {
        var seq = '0..1..2...3.45';
        rxify.from(seq).take(3).toArray().should.deep.equal(['0','1','2']);
    });
    it('handles basic operation with error', function() {
        var seq = '0..1.!2...3.45';
        rxify.from(seq).take(3).toArray().should.deep.equal(['0','1']);
    });
});

describe('#throttle', function() {
    it('handles basic operation', function() {
        rxify.from('aaabbbcccddd').throttle(1).toString().should.equal('aaabbbcccddd');
        rxify.from('aaabbbcccddd').throttle(2).toString().should.equal('a.a.b.c.c.d.');
        rxify.from('aaabbbcccddd').throttle(3).toString().should.equal('a..b..c..d..');
        rxify.from('aaabbbcccddd').throttle(4).toString().should.equal('a...b...c...');
    });
});

describe('#where', function() {
    var seq =      '123456789';
    it('handles basic operation', function() {
        rxify.from(seq).where(function(elem) {
            return elem % 2 == 0;
        }).toString().should.equal('.2.4.6.8.');
    });
});

describe('#while', function() {
    it('handles basic operation', function() {
        var i = 0;
        rxify.while(function(){ return ++i <= 4; },'Aa.').toString().should.equal('Aa.Aa.Aa.Aa.');
        rxify.while(function(){ return false; },'xyz').toString().should.equal('');
    });
});

describe('#zip', function() {
    var seqa = 'A...B.....C';
    var seqb = '..1...2.3..';
    var seqc = 'x....y....z';
    var op = rxify.zip.bind(rxify);
    var from = rxify.from.bind(rxify);
    var chunk1 = from(seqa);
    var chunk2 = from(seqb);
    var chunk3 = from(seqc);
    var expected = '..(A1x)...(B2y)...(C3z)';

    // Run twice to ensure objects aren't unexpectedly mutated
    [1,2].forEach(function(idx) {
        it('handles an array of strings', function() {
            op(seqa,seqb,seqc).toString().should.equal(expected);
        });
        it('handles an array of strings of varying length (padded)', function() {
            op(seqa,seqb + '......' ,seqc).toString().should.equal(expected + '......');
            op(seqa,seqb,seqc + '..').toString().should.equal(expected + '..');
        });

        it('handles an object chain', function() {
            from(seqa).zip(seqb).zip(seqc).toString().should.equal('..((A1)x)...((B2)y)...((C3)z)');
        });

        it('handles an array of objects', function() {
            op(chunk1,chunk2,chunk3).toString().should.equal(expected);
        });

        it('handles an array of mixed types', function() {
            [
                op(chunk1,chunk2,chunk3).toString(),
                op(seqa,chunk2,chunk3).toString(),
                op(chunk1,seqb,chunk3).toString(),
                op(chunk1,chunk2,seqc).toString(),
                op(seqa,chunk2,seqc).toString(),

            ].forEach(function(elem) {
                elem.should.equal(expected);
            });
        });
     });
});

describe('extended functions (display)', function() {
    var obs;
    var expected = [
        {
            arguments: [ 'A..B..', '1....2' ],
            operation: 'zip',
            output: '(A1)....(B2)|' 
        },
        { 
            arguments: [ 1 ], 
            operation: 'take', 
            output: '(A1)|' 
        }
   ];
   
   it('handles display() properly', function() {
       obs = rxify.zip('A..B..','1....2').take(1);
       obs.display().should.deep.equal(expected);
   });
   it('returns same value on subsequent calls', function() {
       obs.display().should.deep.equal(expected);
   });
   it('additional call does not mutate history', function() {
       obs.concat('Z....');
       obs.display().should.deep.equal(expected);
   });
   it('additional call is properly appended to history', function() {
       var obs2 = obs.concat('Z....');
       var expected2 = Array.prototype.slice.call(expected);
       expected2.push({
           arguments: ['Z....'],
           operation: 'concat',
           output: '(A1)Z....|'
       });
       obs2.display().should.deep.equal(expected2);
   });

   it('additional call does not mutate history', function() {
       obs.display().should.deep.equal(expected);
   });
   
   it('retains original operation name', function() {
       obs = rxify.of('J').delay(4);
       obs.display().should.deep.equal([{
           arguments: ['.','.','.','.'],
           operation: 'delay',
           output: '....J|'
       }]);
   });
   
});
