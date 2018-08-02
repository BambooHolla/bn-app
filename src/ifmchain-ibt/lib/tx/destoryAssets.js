'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Validator = require('../validator');
var DestoryAssetsSchema = require('./schema/destoryAssets.js');
var BigNumber = require('bignumber.js');

function accMul(arg1, arg2) {

    arg1 = arg1.toString();
    arg2 = arg2.toString();
    
    var x = new BigNumber(arg1);
    var y = new BigNumber(arg2);

    return x.times(y).toString();
}

/**
 * 数字资产"转账"交易
 *
 * @class
 */

var DestoryAssets = function () {

    /**
     *
     * @param mod
     * @param lib
     * @constructor
     */
    function DestoryAssets() {
        _classCallCheck(this, DestoryAssets);
    }

    /**
     *
     * @param data
     * @param trs
     */

    _createClass(DestoryAssets, [{
        key: 'create',
        value: function create(data, trs) {
            trs.recipientId = null;

            trs.asset.destoryAsset = {
                assetsId: data.asset.destoryAsset.assetsId || '',
                assetName: data.asset.destoryAsset.assetName || '',
                abbreviation: data.asset.destoryAsset.abbreviation || ''/* ,
                destoryAssets: accMul(data.asset.destoryAsset.destoryAssets, 100000000) */
            };

            return trs;
        }
    }, {
        key: 'validateInput',
        value: function validateInput(data, cb) {
            Validator.validate(data, DestoryAssetsSchema, cb);
        }

        /**
         *
         * @param trs
         * @param sender
         */

    }, {
        key: 'calculateFee',
        value: function calculateFee(trs, sender) {
            return library.logic.block.calculateFee();
        }

        /**
         *
         * @param trs
         * @param sender
         * @param cb
         */

    }, {
        key: 'verify',
        value: function verify(trs, sender, cb) {
            if (trs.amount != "0") {
                return cb({
                    message: "Invalid transaction amount"
                });
            }

            /* if (new BigNumber(0).gt(trs.asset.destoryAsset.destoryAssets)) {
                return cb({
                    message: "Invalid destory assets number"
                });
            } */
    
            if (new BigNumber(0).gt(trs.fee)) {
                return cb({
                    message: "Invalid transaction fee"
                });
            }
    
            if (!(trs.asset && trs.asset.destoryAsset)) {
                return cb({
                    message: "Invalid transaction asset"
                });
            }
    
            if (trs.asset.destoryAsset.assetName) {
                if (trs.asset.destoryAsset.assetName.length < 3 || trs.asset.destoryAsset.assetName.length > 30) {
                    return cb({
                        message: "Invalid username length. Must be between 3 to 30 characters"
                    });
                }
            }
    
            if (trs.asset.destoryAsset.abbreviation) {
                if (trs.asset.destoryAsset.abbreviation.length < 3 || trs.asset.destoryAsset.abbreviation.length > 5) {
                    return cb({
                        message: "Invalid abbreviation length. Must be between 3 to 5 characters"
                    });
                }
            }

            /* if (!trs.asset.destoryAsset.destoryAssets) {
                return cb({
                    message: "Destory assets number is required"
                })
            } */

            cb(null, trs);
        }

        /**
         *
         * @param trs
         * @param sender
         * @param cb
         */

    }, {
        key: 'process',
        value: function process(trs, sender, cb) {
            cb(null, trs);
        }

        /**
         *
         * @param trs
         */

    }, {
        key: 'getBytes',
            value: function getBytes(trs) {
                var buf = void 0;

                try {
                    buf = Buffer.from([]);
                    if (trs.asset.destoryAsset.assetsId) {
                        var idBuf = Buffer.from(trs.asset.destoryAsset.assetsId);
                        buf = Buffer.concat([buf, idBuf]);
                    }

                    if (trs.asset.destoryAsset.assetName) {
                        var nameBuf = Buffer.from(trs.asset.destoryAsset.assetName);
                        buf = Buffer.concat([buf, nameBuf]);
                    }

                    if (trs.asset.destoryAsset.abbreviation) {
                        var abbrBuf = Buffer.from(trs.asset.destoryAsset.abbreviation);
                        buf = Buffer.concat([buf, abbrBuf]);
                    }

                    /* if (trs.asset.destoryAsset.destoryAssets) {
                        var desAssBuf = Buffer.from(trs.asset.destoryAsset.destoryAssets);
                        buf = Buffer.concat([buf, desAssBuf]);
                    } */

                } catch (e) {
                    throw Error(e.toString());
                }

                return buf;
            }

        /**
         *
         * @param trs
         */

    }, {
        key: 'objectNormalize',
        value: function objectNormalize(trs) {
            for (var i in trs.asset.destoryAsset) {
                if (trs.asset.destoryAsset[i] === null || typeof trs.asset.destoryAsset[i] === 'undefined') {
                    delete trs.asset.destoryAsset[i];
                }
            }

            var report = library.scheme.validate(trs.asset.issueAsset, {
                type: "object",
                properties: {
                    abbreviation: {
                        type: "string",
                        minLength: 1,
                        maxLength: 64
                    }/* ,
                    destoryAssets: {
                        type: "string",
                        minLength: 1
                    } */
                },
                required: ["abbreviation"/* , "destoryAssets" */]
            });

            if (!report) {
                throw Error('Can\'t verify dapp new transaction, incorrect parameters: ' + library.scheme.getLastError());
            }

            return trs;
        }

        /**
         *
         * @param trs
         * @param sender
         */

    }, {
        key: 'ready',
        value: function ready(trs, sender) {
            if (sender.multisignatures.length) {
                if (!trs.signatures) {
                    return false;
                }

                return trs.signatures.length >= sender.multimin - 1;
            } else {
                return true;
            }
        }
    }]);

    return DestoryAssets;
}();

module.exports = DestoryAssets;