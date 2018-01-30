
        //collection.aggregate([pipeline1, pipeline2, pipeline3, ...]);
        var aggregation = model.Category.aggregate([
            {
                //Pass only the documents that match the specified conditions to the next pipeline stage.
                //Place as early as possible => Query can take adv. of indexes like find()... => Performance enhancement
                $match: {
                    $or: [{
                        'description.fr': new RegExp('a', 'i'),
                    }, {
                        'description.fr': new RegExp('b', 'i')
                    }]
                }
            },

            {
                $project: {
                    _id: 0,
                    //only _id fields can be excluded (UP TO Version 3.4; >3.4, can exclude other fields)
                    //If you specify the exclusion of a field other than _id, you cannot employ any other $project specification forms.
                    //if you exclude fields, 
                    //-you cannot also specify the inclusion of fields, 
                    //-reset the value of existing fields, or 
                    //-add new fields.

                    infos: 1,
                    //at least one field must be included
                    type: 1,
                    description: 1,
                    refKey: 1,
                    //Used in next pipeline

                    //Either use path or nested obj (NOT BOTH)
                    'infos.createDate': 1,
                    infos: {
                        modifyDate: 1
                    },

                    //Add new field
                    queriedBy: {
                        $concat: [
                            "Nadeem"/* ,
                            " - ",
                            { $substr : ["$description.fr", 0, 10] } */
                            //ERROR: Error: Invalid range, ending index is in the middle of a UTF-8 character.
                            //=> Use $substrCP (Available as from Version 3.4) ~CP = Code Point (uses UTF-8 code point (CP) indexing (zero-based))
                        ]
                    }
                }
            },

            {
                $group: {
                    //contains the distinct group by key
                    //For all document with same 'description.fr', a group is created and *each* is passed to next pipeline
                    //IF _id: null THEN no grouping formed / all input docs from previous pipeline processed

                    _id: '$type' //=== $$CURRENT.type
                    /* {
                        day: {
                            $dayOfMonth: '$infos.createDate' 
                        }, 
                        month: {
                            $month: '$infos.createDate'
                        },
                        year: {
                            $year: '$infos.createDate'
                        }
                    } */,
                    //$sum & $avg: works on numbers only; ignore non-numeric values ()
                    sum: {
                        $sum: {
                            $multiply: ['$refKey', 3]
                        }
                    },
                    count: {
                        //$sum: 1 => document counts
                        $sum: 1
                    },
                    avg: {
                        $avg: '$refKey'
                    },
                    firstDoc: {
                        $first: '$description.fr'
                    },
                    lastDoc: {
                        $last: '$description.fr'
                    },
                    maxDate: {
                        $max: '$infos.modifyDate'
                    },
                    minDate: {
                        $min: '$infos.modifyDate'
                    },
                    array: {
                        $push: '$$CURRENT'
                        //Pushes whole document*** 
                        //Can also use $$ROOT (normally points at same doc, but $$CURRENT is modifiable)
                    }/* ,
                    set: {
                        $addToSet: '$description.fr' //set => Unique values only stored in Set
                    } */
                }
            },

            //Another $project pipeline (same can be used multiple times; this one applies on the groups; the previous one applied on the docs before grouping)
            {
                $project: {
                    _id: 0,
                    sum: 1,
                    count: 1,
                    avg: 1,

                    //Replace existing field's value.
                    //array: "Replaced won't work" ($ expected; when dealing with raw string, use $concat)
                    array: {
                        $concat: ["Length of Array: ", {
                            $cond: {
                                if: {
                                    $gt: ['$count', 50]
                                },

                                then: { $substr: [{ $size: "$array" }, 0, -1] },
                                //Converting Number to String: {$substr: [<number>, 0, -1]}

                                else: { $concat: ['< 50', ' | count: ', { $substr: ['$count', 0, -1] }] }
                            }
                        }]
                    }
                }
            },

            {
                $sort: { count: 1 } //1 => ASC, -1 => DESC
            }
        ])

        //Using exec() allow options to be changed; could have used .then().catch()
        aggregation.options = {
            //explain: true,
            allowDiskUse: true, //Allows handling of large datasets (by using Disk as well instead of RAM only)

            //Can also be used as: model.find(query).collation(collationOptions).exec(...)
            collation: { //~$match / $sort... (allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks)
                locale: "fr",
                //mandatory; all others field are optional.

                strength: 1,
                //1 => Base level, 
                //2 => Includes Diacritics (includes sign, accent, c-cedilla), 
                //3 => Includes Case and Letter Variants

                caseFirst: "upper",
                //Determines sort order of case differences during tertiary level comparisons: ("upper" | "lower" | "off")

                numericOrdering: true,
                //Determines whether to compare numeric strings as numbers or as strings
                //true => '10' > '2'
                //false => '10' < '2',

                alternate: "non-ignorable",
                //Determines whether collation should consider whitespace and punctuation as base characters for purposes of comparison
                //"non-ignorable": Whitespace and punctuation are considered base characters.
                //"shifted": Whitespace and punctuation are not considered base characters and are only distinguished at strength levels greater than 3.

            }//For default params of each locale, see https://docs.mongodb.com/manual/reference/collation-locales-defaults/#collation-default-params
        }

        aggregation.exec(function (err, categories) {
            if (err) console.log(err);
            debugger;
            //limiting items in console
            _.times(categories.length > 5 ? 5 : categories.length, function (i) {
                console.log(categories[i]);

            });
            console.log(categories.length);
        });
