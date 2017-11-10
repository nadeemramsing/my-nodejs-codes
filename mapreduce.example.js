        var variable = [1, 2, 3, 4, 5];

        model.Category.mapReduce({
            query: {
                'description.fr': new RegExp('a')
            },

            sort: { //applied to query
                'description.fr': -1
            },

            limit: 50, //max no. of documents; to use skip, can set {out: '__MapReduceCollectionName'} and then use find().skip().limit().select().populate()...

            scope: { //make variables available inside map, reduce and finalize
                variable: variable
            },

            map: function () {
                //for each type, an object will be created: (key, value)
                //value will be pushed into an array if more than one

                //emit(key, value)
                emit(this.type, this.description.fr);
            },

            reduce: function (key, valuesArray) {
                /* if (key == null)
                    return valuesArray.slice(0, 1)
                else */ //NOT WORKING
                    return valuesArray.map(function (item) {
                        return item.slice(0, 5) + key.toString().slice(-5)
                    }).join(', ');
            },

            finalize: function (key, reducedValue) {
                for (var i in variable) { //this.variable also works
                    reducedValue += variable[i];
                }
                return reducedValue.toUpperCase() + ', ' + key;
            },

            out: { 'inline': 1 },

            jsMode: true // Whether to convert intermediate data into BSON format between the execution of the map and reduce functions
            //check performance/response time to see if it's worthy

        }, function (err, testModel) {
            console.log(testModel);
            /* testModel.find().exec(function (err, testResults) {
                console.log(testResults);
                debugger;
            }); */
        });
