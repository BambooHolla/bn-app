var transferAssets = {
    type: "object",
    properties: {
        //支付账户的登录密码
        secret: {
            type: "string",
            minLength: 1
        },
        secondSecret: {
            type: "string",
            minLength: 1
        },
        publicKey: {
            type: "string",
            format: "publicKey"
        },
        //支付账户的金额
        amount: {
            type: 'string',
            format: 'ibtCurrency'
            // minimum: 1
            //maximum: constants.totalAmount
        },
        //接受方账户
        recipientId: {
            type: "string",
            format: "address"
        },
        multisigAccountPublicKey: {
            type: "string",
            format: "publicKey"
        },
        fee: {
            type: "string",
            format: 'ibtCurrency'
        },
        assetType: {
            type: "string",
            minLength: 1 
        }
    },
    required: ["secret", "fee", "assetType"]
}

module.exports = transferAssets;