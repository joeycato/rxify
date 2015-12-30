# rxify An RxJS library wrapper that lets you execute Rx operators directly using marble-diagram ASCII string arguments.

**rxify** was mainly created as an educational tool to guide those ramping up on Reactive Extensions for the first time by presenting an alternative way to visualize and experiment on its asynchronous features. However, some folks may find it useful for other purposes such as general problem-solving or simplifying unit tests.

Each string argument is basically an observable sequence expressed in ASCII marble diagram notation. For example, the string ```'A...B'``` represents a stream of two events separated by some passage of time. In **rxify** the actual unit of time is not important, so it may be easier to just imagine each ```'.'``` as one *tick* of time. Also, to simplify things further, the end of a string is automatically interpreted as an ```onCompleted``` action. Technically you can represent that with ```'|'``` but it's purely optional.


##### Marble Notation / Terminology
|Sequence Character | Meaning |
| :------------- | :------------- |
| **.** | One tick of elapsed time |
| **&#124;** | onCompleted() event |
| **!** | onError() event |
| **(** **)** | A grouped set of coinciding events |
| A-Z, 0-9 | onNext() event |

##### Basic Examples

The easiest way to convert a marble string directly to an observable is to call **rxify.of**, **rxify.just**, or **rxify.from**:

```javascript
var obs = rxify.of('A...B...');
obs = rxify.just('A...B...');
obs = rxify.from('A...B...');
console.log(obs.toString());
// Output: 'A...B...'
```

You can also pass these strings directly in as normal arguments:

```javascript
obs = rxify.concat('A...','B...','C...');
console.log(obs.toString());
// Output: 'A...B...C...'
```

##### Chaining Operators
```javascript
obs = rxify.of('A...B...').concat('C...')
console.log(obs.toString());
// Output: 'A...B...C...'
```

```javascript
obs = rxify.zip('A...B...C...','123').take(2);
console.log(obs.toString());
// Output: '(A1)...(B2)'
```
##### Visualizing Output
If you'd like to see a verbose colorized step-by-step breakdown on a chained set of operations, you can call the extended ```display()``` method.

```javascript
obs = rxify.zip('A...B...C...','123').take(2);
obs.display();
// Outputs:
// OPERATION ARGUMENTS              OUTPUT
// zip       ["A...B...C...","123"] (A1)...(B2)...(C3)...|
// take      [2]                    (A1)...(B2)|
```

#### Dealing with Time

Note: When calling a RxJS operator that normally expects a time-based argument in milliseconds, with rxify you should instead pass in the desired number of ticks. For example:
```javascript
rxify.delay(3) // Interpreted as '...'
```
Note: You can also represent the argument as a sequence string:
```javascript
rxify.delay('...')
```

##### More Examples

```javascript
var seqa = 'A...B.....C';
var seqb = '..1...2.3..';
var seqc = 'x....y....z';
var obs = rxify.combineLatest(seqa, seqb, seqc );
console.log(obs.toString());
// Output: '..(A1x).(B1x)(B1y)(B2y).(B3y).(C3z)'
```

```javascript
var i = 0;
console.log('doWhile example: ' + rxify.from('Aa.').
            doWhile(function() {
                return ++i <= 4;
            })
);
// Output: 'doWhile example: Aa.Aa.Aa.Aa.Aa.'
```

```javascript
var seq = '123456789';
console.log('filter example: ' + rxify.from(seq).
    filter(function(elem) {
        return elem % 2 == 0;
    })
);
// Output: 'filter example: .2.4.6.8.'
```

```javascript
console.log('bufferWithTime: ' + rxify.interval(1).
    bufferWithTime(5,1).
    take(3)
);
// Output: 'bufferWithTime: ....(0,1,2,3,4)(0,1,2,3,4,5)(2,3,4,5,6)'
```

```javascript
var input = 'AA..BBB..CCCC...DDDD...EEEEEE..FFFFF..GGGGG';
console.log('debounce: ' + rxify.of(input).debounce(1).toString());
// Output: '..A....B.....C......D........E......F.....G'
```

If you'd like more examples on how to use rxify, please refer to the unit tests on the main repo.

#### Supported Observable Methods
* **amb**
* **catch**
* **combineLatest**
* **concat**
* **empty**
* **for**
* **forkJoin**
* **from**
* **generate**
* **if**
* **interval**
* **just**
* **merge**
* **mergeDelayError**
* **of**
* **onErrorResumeNext**
* **pairs**
* **range**
* **repeat**
* **return**
* **start**
* **timer**
* **while**
* **zip**

#### Supported Observable Instance Methods
* **average**
* **bufferWithCount**
* **bufferWithTime**
* **catch**
* **combineLatest**
* **concat**
* **count**
* **debounce**
* **defaultIfEmpty**
* **delay**
* **distinct**
* **distinctUntilChanged**
* **do**
* **doOnCompleted**
* **doOnError**
* **doOnNext**
* **doWhile**
* **elementAt**
* **every**
* **filter**
* **finally**
* **find**
* **findIndex**
* **first**
* **flatMap**
* **flatMapLatest**
* **forEach**
* **forkJoin**
* **ignoreElements**
* **isEmpty**
* **last**
* **let**
* **map**
* **max**
* **maxBy**
* **merge**
* **min**
* **minBy**
* **onErrorResumeNext**
* **pairwise**
* **pluck**
* **reduce**
* **retry**
* **sample**
* **scan**
* **select**
* **selectMany**
* **sequenceEqual**
* **skip**
* **skipLast**
* **skipLastWithTime**
* **skipUntil**
* **skipUntilWithTime**
* **skipWhile**
* **some**
* **startWith**
* **subscribe**
* **subscribeOnCompleted**
* **subscribeOnError**
* **subscribeOnNext**
* **sum**
* **take**
* **takeLast**
* **takeLastBuffer**
* **takeLastBufferWithTime**
* **takeLastWithTime**
* **takeUntil**
* **takeUntilWithTime**
* **takeWhile**
* **tap**
* **tapOnCompleted**
* **tapOnError**
* **tapOnNext**
* **throttle**
* **timeout**
* **timeInterval**
* **timestamp**
* **toArray**
* **where**
* **zip**
