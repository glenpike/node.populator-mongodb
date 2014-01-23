/**
 * The MIT License (MIT)
 * Copyright (c) 2014 SAS 9 Février
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict;';

var augment = require('js.augment');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var log4js = require('log4js');

var conn = null;

var logger = log4js.getLogger('populate');
logger.setLevel('INFO');

/**
 * Class to populate database with mongodb native driver.
 * @name PopulatorMongoDB
 * @param {string} filename - The file which contains data to insert.
 * @constructor
 */
var PopulatorMongoDB = function (uri, data) {
    this.uri = uri;
    this.data = data;
    return this;
};

PopulatorMongoDB.prototype = {
    /**
     * memberof PopulatorMongoDB
     */
    constructor: PopulatorMongoDB,

    connectDatabase: function (uri) {
        return function (callback) {
            logger.debug('connectDatabase:start');
            var self = this;
            MongoClient.connect(uri, function (err, db) {
                if (err) throw err;
                logger.debug('connectDatabase:finished');
                self.conn = db;
                callback(err);
            });
        }
    },

    dropDatabase: function (callback) {
        var self = this;
        logger.debug('dropDatabase:start');
        this.conn.dropDatabase(function (err, done) {
            if (err) throw err;
            logger.debug('dropDatabase:finished');
            callback(null);
        });
    },

    closeDatabase: function (callback) {
        var self = this;
        logger.debug('closeDatabase:start');
        self.conn.close(function (err, done) {
            if (err) throw err;
            logger.debug('closeDatabase:finished');
            callback(null);
        })
    },


    getCollectionNames: function (data) {
        return function (callback) {
            var self = this;
            logger.debug('getCollectionsNames:start');
            var retval = [];
            logger.debug('idata ' + typeof(data));
            var len = Object.keys(data).length;
            logger.debug('getCollectionsNames:len:' + len);
            var i = 0;
            Object.keys(data).forEach(function (item) {
                logger.debug(item);
                self.conn.createCollection(item, function (err, collection) {
                    if (err) throw err;
                    collection.insert(data[item], {
                        safe: true
                    }, function (e, d) {
                        i++;
                        if (e) throw e;
                        logger.debug('data for ' + item + 'created');
                        if (len === i) callback();
                    })

                });
            });
        }
    },

    populate: function (callback) {
        var self = this;
        logger.debug('populate:start');
        async.waterfall([
            self.connectDatabase(self.uri),
            self.dropDatabase,
            self.getCollectionNames(self.data),
            self.closeDatabase
        ], function (err, results) {
            logger.debug('populate:finished');
            callback();
        });
    }
};

module.exports = PopulatorMongoDB;
