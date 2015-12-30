var rxify = require('../es5/index');

module.exports = {

    run: function() {

        // Basic Examples
        var obs = rxify.of('A...B...');
        obs = rxify.just('A...B...');
        obs = rxify.from('A...B...');
        console.log(obs.toString());
        // Output: 'A...B...'

        obs = rxify.concat('A...','B...','C...');
        console.log(obs.toString());
        // Output: 'A...B...C...'

        // Chaining Operators
        obs = rxify.of('A...B...|').concat('C...')
        console.log(obs.toString());
        // Output: 'A...B...C...'

        obs = rxify.zip('A...B...C...','123').take(2);
        console.log(obs.toString());
        // Output: '(A1)...(B2)'

        // Visualizing Output
        obs = rxify.zip('A...B...C...','123').take(2);
        obs.display();
        // Outputs:
        // OPERATION ARGUMENTS              OUTPUT
        // zip       ["A...B...C...","123"] (A1)...(B2)...(C3)...|
        // take      [2]                    (A1)...(B2)|

        // More examples
        var seqa = 'A...B.....C';
        var seqb = '..1...2.3..';
        var seqc = 'x....y....z';
        var obs = rxify.combineLatest(seqa, seqb, seqc );
        console.log(obs.toString());

        var i = 0;
        console.log('doWhile example: ' + rxify.from('Aa.').
                    doWhile(function() {
                        return ++i <= 4;
                    })
        );
        // Output: 'doWhile example: Aa.Aa.Aa.Aa.Aa.'

        var seq = '123456789';
        console.log('filter example: ' + rxify.from(seq).
            filter(function(elem) {
                return elem % 2 == 0;
            })
        );
        // Output: 'filter example: .2.4.6.8.'

        console.log('bufferWithTime example: ' + rxify.interval(1).
            bufferWithTime(5,1).
            take(3)
        );
        // Output: 'bufferWithTime: ....(0,1,2,3,4)(0,1,2,3,4,5)(2,3,4,5,6)'

        var input = 'AA..BBB..CCCC...DDDD...EEEEEE..FFFFF..GGGGG';
        console.log('debounce example: ' + rxify.of(input).debounce(1).toString());
        // Output: '..A....B.....C......D........E......F.....G'

    }
}
