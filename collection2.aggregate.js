model.StateHistory.aggregate()
                .match({
                    article: {
                        $in: ids
                    }
                })
                .lookup({
                    from: 'states', //Collection name in MongoDB; NOT model name
                    localField: 'state',
                    foreignField: '_id',
                    as: 'state' //Array of length 1
                })
                .project({
                    state: {
                        $arrayElemAt: ["$state", 0] //Array -> Object
                    },
                    article: 1,
                    date: 1
                })
                .then(function (statehistories) {
                    callback(null, articles, statehistories)
                })
                .catch(function (err) {
                    callback(err);
                })
