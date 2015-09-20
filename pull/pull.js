var request = require('request');
var mongoose = require('mongoose');
var Issue = mongoose.model('Issue')
var async = require('async');

exports.getIssue = function() {

    //repository list
    var repository = []

    repository.push({
        repository: 'HermanKongCode/movie',
        options: {
            'url': 'https://api.github.com/repos/HermanKongCode/movie/issues?access_token=6adfb1c9cf604f96c77c8fdb883ce700b040bc94',
            'headers': {
                'User-Agent': 'HermanKongCode/movie'
            },
            'json': true,
        },
        destination: 'http://requestb.in/139u3ku1'
    })

    repository.push({
        repository: 'HermanKongCode/issue-update-webhook',
        options: {
            'url': 'https://api.github.com/repos/HermanKongCode/issue-update-webhook/issues?access_token=6adfb1c9cf604f96c77c8fdb883ce700b040bc94',
            'headers': {
                'User-Agent': 'HermanKongCode/issue-update-webhook'
            },
            'json': true,
        },
        destination: 'http://requestb.in/139u3ku1'
    })

    //start to detect the issue of each repository
    async.forEach(repository, function(item, callback) {
        request(item.options, function(err, res, issueResponse) {
            callback({
                issueResponse: issueResponse,
                item: item
            })
        });
    }, function(response) {
        //check db record
        Issue.find({
            repository: response.item.repository,
        })
            .exec(function(err, dbData) {
                var isInsert = true
                if (err) return next(err);
                if (dbData.length != 0) {
                    isInsert = false
                }

                var param = {
                    isInsert: isInsert,
                    issueResponse: response.issueResponse,
                    dbData: dbData,
                    item: response.item
                }

                if (!param.isInsert) {
                    for (var i = 0; i < param.issueResponse.length; i++) {
                        if (param.issueResponse[i].title != param.dbData[i].title || param.issueResponse[i].body != param.dbData[i].description) {
                            console.log('Issue is Updated');

                            param.isInsert = true

                            //POST webhook
                            request({
                                url: param.item.destination,
                                method: 'POST',
                                json: true,
                                body: {
                                    action: 'updated',
                                    issue: {
                                        url: param.issueResponse[i].url,
                                        labels_url: param.issueResponse[i].labels_url,
                                        comments_url: param.issueResponse[i].comments_url,
                                        events_url: param.issueResponse[i].events_url,
                                        html_url: param.issueResponse[i].html_url,
                                        id: param.issueResponse[i].id,
                                        number: param.issueResponse[i].number,
                                        title: param.issueResponse[i].title,
                                        state: param.issueResponse[i].state,
                                        locked: param.issueResponse[i].locked,
                                        assignee: param.issueResponse[i].assignee,
                                        milestone: param.issueResponse[i].milestone,
                                        comments: param.issueResponse[i].comments,
                                        created_at: param.issueResponse[i].created_at,
                                        updated_at: param.issueResponse[i].updated_at,
                                        closed_at: param.issueResponse[i].closed_at,
                                        body: param.issueResponse[i].body
                                    },
                                    repository: param.issueResponse[i].user
                                }
                            })
                        }
                    }
                }
                if (param.isInsert) {
                    //clear data of db
                    Issue.remove({
                        repository: param.item.repository
                    }, function(err) {
                        if (err) return next(err);
                    });

                    //insert data to db
                    for (var i = 0; i < param.issueResponse.length; i++) {
                        new Issue({
                            login: param.issueResponse[i].user.login,
                            repository: param.item.repository,
                            title: param.issueResponse[i].title,
                            description: param.issueResponse[i].body
                        }).save()
                    }
                }
            })
    });

    return
};
