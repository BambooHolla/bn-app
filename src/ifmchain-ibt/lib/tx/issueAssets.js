"use strict";

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var configFactory = require("../helpers/configFactory");
var constants = configFactory.getConstants();
var ByteBuffer = require("bytebuffer");
var Buffer = require("buffer/").Buffer;
var Validator = require("../validator");
var addressHelper = require("../helpers/address.js");
var issueAssetsSchema = require("./schema/issueAssets.js");
var library = void 0;

var BigNumber = require("../helpers/bignum.js");

function accMul(arg1, arg2) {
  arg1 = arg1.toString();
  arg2 = arg2.toString();

  var x = new BigNumber(arg1);
  var y = new BigNumber(arg2);

  return x.times(y).toString();
}

/**
 * 发行数字资产
 *
 * @class
 * */

var IssueAssets = (function() {
  /**
   * 初始化数字资产
   *
   * @constructor
   * */
  function IssueAssets() {
    _classCallCheck(this, IssueAssets);
  }

  /**
   * 创建类型为发行数字资产的交易
   *
   * @param {Object} data assets 信息
   * @param {Object} trs 交易信息
   * @private
   * @return {Object} 交易信息
   * */
  _createClass(IssueAssets, [
    {
      key: "create",
      value: function create(data, trs) {
        trs.recipientId = null;

        trs.asset.issueAsset = {
          address: data.asset.issueAsset.address,
          publicKey: data.asset.issueAsset.publicKey,
          rate: data.asset.issueAsset.rate,
          logo: data.asset.issueAsset.logo,
          abbreviation: data.asset.issueAsset.abbreviation,
          expectedFrozenIBTs: accMul(
            data.asset.issueAsset.expectedFrozenIBTs,
            100000000
          ),
          expectedIssuedAssets: accMul(
            data.asset.issueAsset.expectedIssuedAssets,
            100000000
          ),
          genesisAddress: data.asset.issueAsset.genesisAddress,
        };

        return trs;
      },
    },
    {
      key: "validateInput",
      value: function validateInput(data, cb) {
        Validator.validate(data, issueAssetsSchema, cb);
      },

      /**
       * 计算费用
       *
       * @param {Object} trs 交易信息
       * @param {Object} sender 发送人
       * @private
       * @return {number}
       * */
    },
    {
      key: "calculateFee",
      value: function calculateFee(trs, sender) {
        return 500 * constants.fixedPoint;
      },

      /**
       * 核对dapp商品信息
       *
       * @param {Object} trs 交易信息
       * @param {Object} sender 发送人
       * @param {Function} cb 核对后执行的函数
       * @private
       * @return {Function(Function,string)} 异步延时处理函数
       * */
    },
    {
      key: "verify",
      value: function verify(trs, sender, cb) {
        if (trs.recipientId) {
          return cb({
            message: "Invalid recipient",
          });
        }

        if (trs.amount != "0") {
          return cb({
            message: "Invalid transaction amount",
          });
        }

        if (!(trs.asset && trs.asset.issueAsset)) {
          return cb({
            message: "Invalid transaction asset",
          });
        }

        if (!addressHelper.isAddress(trs.asset.issueAsset.address)) {
          return cb({
            message: "Invalid transaction asset",
          });
        }

        if (trs.asset.issueAsset.assetName) {
          if (
            trs.asset.issueAsset.assetName.length < 3 ||
            trs.asset.issueAsset.assetName.length > 30
          ) {
            return cb({
              message:
                "Invalid username length. Must be between 3 to 30 characters",
            });
          }
        }

        if (trs.asset.issueAsset.abbreviation) {
          if (
            trs.asset.issueAsset.abbreviation.length < 3 ||
            trs.asset.issueAsset.abbreviation.length > 5
          ) {
            return cb({
              message:
                "Invalid abbreviation length. Must be between 3 to 5 characters",
            });
          }
        }

        if (trs.asset.issueAsset.summary) {
          if (trs.asset.issueAsset.summary.length > 100) {
            return cb({
              message:
                "Invalid summary length. Must be less than 100 characters",
            });
          }
        }

        if (!trs.asset.issueAsset.rate) {
          return cb({
            message: "Assets original divided rate is required",
          });
        }

        if (!trs.asset.issueAsset.logo) {
          return cb({
            message: "Assets logo is required",
          });
        }

        /* if (!trs.asset.issueAsset.originalFrozenIBT) {
                return cb({
                    message: "Assets original frozen IBT is required"
                })
            } */

        if (!trs.asset.issueAsset.expectedIssuedAssets) {
          return cb({
            message: "Assets original issued assets number is required",
          });
        }

        if (!trs.asset.issueAsset.expectedRaisedIBTs) {
          return cb({
            message: "Assets expected raised ibt number is required",
          });
        }

        if (!trs.asset.issueAsset.expectedIssuedBlockHeight) {
          return cb({
            message: "Assets expected issued block height is required",
          });
        }

        if (!addressHelper.isAddress(trs.asset.issueAsset.genesisAddress)) {
          return cb({
            message: "Invalid assets genesis address",
          });
        }

        cb();
      },

      /**
       * 处理交易
       *
       * @param {Object} trs 交易信息
       * @param {Object} sender 发送人
       * @param {Function} cb 处理函数
       * @private
       * @return {Function(Function,null,Object)} 异步延时处理函数
       * */
    },
    {
      key: "process",
      value: function process(trs, sender, cb) {
        // setImmediate(cb, null, trs);
        cb(null, trs);
      },

      /**
       * urf-8字符编码
       *
       * @param {Object} trs 交易信息
       * @private
       * @return
       * */
    },
    {
      key: "getBytes",
      value: function getBytes(trs) {
        var buf = void 0;

        buf = Buffer.from([]);
        if (trs.asset.issueAsset.address) {
          var addressBuf = Buffer.from(trs.asset.issueAsset.address);
          buf = Buffer.concat([buf, addressBuf]);
        }

        if (trs.asset.issueAsset.publicKey) {
          var pkBuf = Buffer.from(trs.asset.issueAsset.publicKey);
          buf = Buffer.concat([buf, pkBuf]);
        }

        var logoBuf = Buffer.from(trs.asset.issueAsset.logo);
        buf = Buffer.concat([buf, logoBuf]);

        var abbrBuf = Buffer.from(trs.asset.issueAsset.abbreviation);
        buf = Buffer.concat([buf, abbrBuf]);

        var efiBuf = Buffer.from(trs.asset.issueAsset.expectedFrozenIBTs);
        buf = Buffer.concat([buf, efiBuf]);

        var eiaBuf = Buffer.from(trs.asset.issueAsset.expectedIssuedAssets);
        buf = Buffer.concat([buf, eiaBuf]);

        var gasBuf = Buffer.from(trs.asset.issueAsset.genesisAddress);
        buf = Buffer.concat([buf, gasBuf]);

        var bb = new ByteBuffer(4, true);
        bb.writeInt(trs.asset.issueAsset.rate);
        bb.flip();

        buf = Buffer.concat([buf, Buffer.from(bb.toString("hex"), "hex")]);

        return buf;
      },
    },
    {
      key: "objectNormalize",
      value: function objectNormalize(trs) {
        for (var i in trs.asset.issueAsset) {
          if (
            trs.asset.issueAsset[i] === null ||
            typeof trs.asset.issueAsset[i] === "undefined"
          ) {
            delete trs.asset.issueAsset[i];
          }
        }

        var report = library.scheme.validate(trs.asset.issueAsset, {
          type: "object",
          properties: {
            address: {
              type: "string",
              minLength: 1,
            },
            publicKey: {
              type: "string",
              format: "publicKey",
            },
            rate: {
              type: "integer",
              minimum: 0,
            },
            logo: {
              type: "string",
              minLength: 1,
            },
            abbreviation: {
              type: "string",
              minLength: 3,
              maxLength: 5,
            },
            expectedFrozenIBTs: {
              type: "string",
            },
            expectedIssuedAssets: {
              type: "string",
            },
            genesisAddress: {
              type: "string",
              minLength: 1,
            },
          },
          required: [
            "rate",
            "logo",
            "abbreviation",
            "expectedFrozenIBTs",
            "expectedIssuedAssets",
            "genesisAddress",
          ],
        });

        if (!report) {
          throw Error(
            "Can't verify dapp new transaction, incorrect parameters: " +
              library.scheme.getLastError()
          );
        }

        return trs;
      },

      /**
       * 验证发送人是否有多重签名帐号,是否签名
       *
       * @param {Object} trs 交易信息
       * @param {Object} sender 发送人
       * @private
       * @return {boolean} 验证结果
       * */
    },
    {
      key: "ready",
      value: function ready(trs, sender) {
        if (sender.multisignatures.length) {
          if (!trs.signatures) {
            return false;
          }
          return trs.signatures.length >= sender.multimin - 1;
        } else {
          return true;
        }
      },
    },
  ]);

  return IssueAssets;
})();

module.exports = IssueAssets;
