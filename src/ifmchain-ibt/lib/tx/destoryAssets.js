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

var Validator = require("../validator");
var DestoryAssetsSchema = require("./schema/destoryAssets.js");
var BigNumber = require("../helpers/bignum.js");

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

var DestoryAssets = (function() {
  function DestoryAssets() {
    _classCallCheck(this, DestoryAssets);
  }

  _createClass(DestoryAssets, [
    {
      key: "create",
      value: function create(data, trs) {
        trs.recipientId = null;
        trs.amount = accMul(data.amount, 100000000);

        return trs;
      },
    },
    {
      key: "validateInput",
      value: function validateInput(data, cb) {
        Validator.validate(data, DestoryAssetsSchema, cb);
      },
    },
    {
      key: "calculateFee",
      value: function calculateFee(trs, sender) {
        return library.logic.block.calculateFee();
      },
    },
    {
      key: "verify",
      value: function verify(trs, sender, cb) {
        if (new BigNumber(0).gt(trs.amount)) {
          return cb({
            message: "Invalid transaction amount",
          });
        }

        if (new BigNumber(0).gt(trs.fee)) {
          return cb({
            message: "Invalid transaction fee",
          });
        }

        // 必须携带数字资产的英文缩写
        if (!trs.assetType) {
          let message = __mf(`Assets abbreviation is require`);
          return cb({
            message,
          });
        }

        if (trs.assetType.length < 3 || trs.assetType.length > 5) {
          let message = __mf(
            "Invalid abbreviation length. Must be between 3 to 5 characters"
          );
          return cb({
            message,
            trs: `trs id: ${trs.id}`,
          });
        }

        cb(null, trs);
      },
    },
    {
      key: "process",
      value: function process(trs, sender, cb) {
        cb(null, trs);
      },
    },
    {
      key: "getBytes",
      value: function getBytes(trs) {
        return null;
      },
    },
    {
      key: "objectNormalize",
      value: function objectNormalize(trs) {
        delete trs.blockId;
        return trs;
      },
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

  return DestoryAssets;
})();

module.exports = DestoryAssets;
