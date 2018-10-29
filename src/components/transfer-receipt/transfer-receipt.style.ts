import { CssLikeStyle, translateX_center, commonFontFamily, iconFontFamily } from "../CssLike";

// const style = {
export const transferReciptStyle: {
  [key: string]: CssLikeStyle
} = {
  /* STYLE 样式 */
  //#region heade,r title
  h_title_style: {
    font: {
      fontFamily: commonFontFamily,
      fontSize() { return this.W * 0.052 },
      fill: 0xFFFFFF,
    },
    transform: {
      translateX: translateX_center,
      translateY() { return this.H * 0.06 }
    }
  },
  //#endregion
  //#region header mid
  h_mid_style: {
    transform: {
      translateX: translateX_center,
      translateY() { return this.prevChildBottom + this.H * 0.03 }
    }
  },
  h_mid_left_style: {
    font: {
      fontFamily: iconFontFamily,
      fontSize() { return this.W * 0.07 },
      fill: 0xFFFFFF,
    },
  },
  h_mid_center_style: {
    font: {
      fontFamily: commonFontFamily,
      fontSize() { return this.W * 0.082 },
      fill: 0xFFFFFF,
      fontWeight: "500",
    },
    transform: {
      translateX() { return this.prevChildRight + 0.02 * this.W },
      translateY() { return this.prevChildBottom - this.target.height + 0.01 * this.W },
    }
  },
  h_mid_right_style: {
    font: {
      fontFamily: commonFontFamily,
      fontSize() { return this.W * 0.038 },
      fontWeight: "300",
      fill: 0xFFFFFF,
    },
    transform: {
      translateX() { return this.prevChildRight + 0.02 * this.W },
      translateY() { return this.prevChildBottom - this.target.height * 1.4 },
    }
  },
  //#endregion
  //#region header btm
  h_btm_style: {
    transform: {
      translateX: translateX_center,
      translateY() { return this.prevChildBottom }
    },
    scale: {
      maxWidth() { return this.W * 0.9 }
    }
  },
  h_btm_left_style: {
    font: {
      fontFamily: commonFontFamily,
      fontSize() { return this.W * 0.042 },
      fill: 0xFFFFFF,
    },
  },
  h_btm_right_style: {
    font: {
      fontFamily: commonFontFamily,
      fontSize() { return this.W * 0.042 },
      fill: 0xFFFFFF,
    },
    transform: {
      translateX() { return this.prevChildRight + 0.02 * this.W },
    },
    scale: {
      maxWidth() { return this.W * 0.75 }
    }
  },
  //#endregion
  //#region header time
  h_time_style: {
    transform: {
      translateX() { return this.W * 0.01 },
      translateY() { return this.prevChildBottom + this.H * 0.015 }
    }
  },
  h_time_left_style: {
    font: {
      fontFamily: iconFontFamily,
      fill: 0xFFFFFF,
      fontSize() { return this.W * 0.04 }
    },
  },
  h_time_right_style: {
    font: {
      fontFamily: commonFontFamily,
      fill: 0xFFFFFF,
      fontSize() { return this.W * 0.038 },
    },
    transform: {
      translateX() { return this.prevChildRight + 0.01 * this.W },
    }
  },
  //#endregion
  //#region content payer
  c_payer_style: {
    transform: {
      translateX() { return this.W * 0.065 },
      translateY() { return this.H * 0.37 },
    }
  },
  c_payer_label_style: {
    font: {
      fill: 0x989898,
      fontSize() { return this.W * 0.042 },
    },
    scale: {
      maxWidth() { return this.W * 0.136 }
    }
  },
  c_payer_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() { return this.W * 0.038 },
    },
    transform: {
      translateX() { return this.W * 0.2 }
    },
    scale: {
      maxWidth() { return this.W * 0.68 }
    }
  },
  //#endregion
  //#region content fee
  c_fee_style: {
    transform: {
      translateX() { return this.W * 0.065 },
      translateY() { return this.prevChildBottom + this.H * 0.09 },
    }
  },
  c_fee_label_style: {
    font: {
      fill: 0x989898,
      fontSize() { return this.W * 0.042 },
    },
    scale: {
      maxWidth() { return this.W * 0.136 }
    }
  },
  c_fee_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() { return this.W * 0.042 },
    },
    transform: {
      translateX() { return this.W * 0.2 }
    }
  },
  c_fee_unit_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() { return this.W * 0.028 },
    },
    transform: {
      translateX() { return this.prevChildRight + this.W * 0.02 },
      translateY() { return this.prevChildBottom - this.target.height * 1.1 }
    }
  },
  //#endregion
  //#region content tid
  c_tid_style: {
    transform: {
      translateX() { return this.W * 0.065 },
      translateY() { return this.prevChildBottom + this.H * 0.09 },
    }
  },
  c_tid_label_style: {
    font: {
      fill: 0x989898,
      fontSize() { return this.W * 0.042 },
    }, scale: {
      maxWidth() { return this.W * 0.136 }
    }
  },
  c_tid_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() { return this.W * 0.038 },
    },
    transform: {
      translateX() { return this.W * 0.2 }
    },
    scale: {
      maxWidth() { return this.W * 0.68 }
    }
  },
  //#endregion
  //#region stamp 印章
  stamp_style: {
    transform: {

    }
  }
  //#endregion
}

// export const transferReciptStyle: {
//   [key in keyof typeof style]: CssLikeStyle
// } = style;
