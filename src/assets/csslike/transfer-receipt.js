module.exports = Object.assign({
  //#region heade,r title
  h_title_style: {
    font: {
      fontSize() {
        return this.W * 0.052
      },
      fill: 0xFFFFFF,
    },
    transform: {
      translateX: `#x-center`,
      translateY() {
        return this.H * 0.06
      }
    }
  },
  //#endregion
  //#region header mid
  h_mid_style: {
    transform: {
      translateX: `#x-center`,
      translateY() {
        return this.prevChildBottom + this.H * 0.03
      }
    }
  },
  h_mid_left_style: {
    font: {
      fontFamily: `#icon-font`,
      fontSize() {
        return this.W * 0.07
      },
      fill: 0xFFFFFF,
    },
  },
  h_mid_center_style: {
    font: {
      fontSize() {
        return this.W * 0.082
      },
      fill: 0xFFFFFF,
      fontWeight: "500",
    },
    transform: {
      translateX() {
        return this.prevChildRight + 0.02 * this.W
      },
      translateY() {
        return this.prevChildBottom - this.target.height + 0.01 * this.W
      },
    }
  },
  h_mid_right_style: {
    font: {
      fontSize() {
        return this.W * 0.038
      },
      fontWeight: "300",
      fill: 0xFFFFFF,
    },
    transform: {
      translateX() {
        return this.prevChildRight + 0.02 * this.W
      },
      translateY() {
        return this.prevChildBottom - this.target.height * 1.4
      },
    }
  },
  //#endregion
  //#region header btm
  h_btm_style: {
    transform: {
      translateX: `#x-center`,
      translateY() {
        return this.prevChildBottom
      }
    },
    scale: {
      maxWidth() {
        return this.W * 0.9
      }
    }
  },
  h_btm_left_style: {
    font: {
      fontSize() {
        return this.W * 0.042
      },
      fill: 0xFFFFFF,
    },
  },
  h_btm_right_style: {
    font: {
      fontSize() {
        return this.W * 0.042
      },
      fill: 0xFFFFFF,
    },
    transform: {
      translateX() {
        return this.prevChildRight + 0.02 * this.W
      },
    },
    scale: {
      maxWidth() {
        return this.W * 0.75
      }
    }
  },
  //#endregion
  //#region header time
  h_time_style: {
    transform: {
      translateX() {
        return this.W * 0.015
      },
      translateY() {
        return this.prevChildBottom + this.H * 0.015
      }
    }
  },
  h_time_left_style: {
    font: {
      fontFamily: `#icon-font`,
      fill: 0xFFFFFF,
      fontSize() {
        return this.W * 0.04
      }
    },
  },
  h_time_right_style: {
    font: {
      fill: 0xFFFFFF,
      fontSize() {
        return this.W * 0.038
      },
    },
    transform: {
      translateX() {
        return this.prevChildRight + 0.01 * this.W
      },
    }
  },
  //#endregion
  //#region content payer
  c_payer_style: {
    transform: {
      translateX() {
        return this.W * 0.065
      },
      translateY() {
        return this.H * 0.37
      },
    }
  },
  c_payer_label_style: {
    font: {
      fill: 0x989898,
      fontSize() {
        return this.W * 0.042
      },
    },
    scale: {
      maxWidth() {
        return this.W * 0.136
      }
    }
  },
  c_payer_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontWeight: "500",
      // stroke: 0xffffff,
      // strokeThickness () {
      //   return this.W * 0.1
      // },
      // dropShadow: true,
      // dropShadowColor: 0xffffff,
      // dropShadowBlur() {
      //   return this.W * 0.01
      // },
      // dropShadowDistance: 0,
      fontSize() {
        return this.W * 0.038
      },
    },
    transform: {
      translateX() {
        return this.W * 0.2
      }
    },
    scale: {
      maxWidth() {
        return this.W * 0.68
      }
    }
  },
  //#endregion
  //#region content fee
  c_fee_style: {
    transform: {
      translateX() {
        return this.W * 0.065
      },
      translateY() {
        return this.prevChildBottom + this.H * 0.09
      },
    }
  },
  c_fee_label_style: {
    font: {
      fill: 0x989898,
      fontSize() {
        return this.W * 0.042
      },
    },
    scale: {
      maxWidth() {
        return this.W * 0.136
      }
    }
  },
  c_fee_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() {
        return this.W * 0.042
      },
    },
    transform: {
      translateX() {
        return this.W * 0.2
      }
    }
  },
  c_fee_unit_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() {
        return this.W * 0.028
      },
    },
    transform: {
      translateX() {
        return this.prevChildRight + this.W * 0.02
      },
      translateY() {
        return this.prevChildBottom - this.target.height * 1.1
      }
    }
  },
  //#endregion
  //#region content tid
  c_tid_style: {
    transform: {
      translateX() {
        return this.W * 0.065
      },
      translateY() {
        return this.prevChildBottom + this.H * 0.09
      },
    }
  },
  c_tid_label_style: {
    font: {
      fill: 0x989898,
      fontSize() {
        return this.W * 0.042
      },
    },
    scale: {
      maxWidth() {
        return this.W * 0.136
      }
    }
  },
  c_tid_content_style: {
    font: {
      fill: 0x7b7b7b,
      fontSize() {
        return this.W * 0.038
      },
    },
    transform: {
      translateX() {
        return this.W * 0.2
      }
    },
    scale: {
      maxWidth() {
        return this.W * 0.68
      }
    }
  },


  stamp_style: {
    scale: {
      scale() {
        return (0.3 * this.W) / this.width
      },
    },
    transform: {
      translateX() {
        return this.W * 0.985 - this.width
      },
      translateY() {
        return this.H * 0.225
      },
    }
  },

}, (function footer_style() {
  var span_width = 0.5;
  var offset_y = 0.83;
  var light_scale = function () {
    return 0.056 * this.W / this.target.texture.width;
  }
  var light_translateY = function () {
    return this.H * offset_y - this.height / 2;
  }
  //#region time style
  var time_fill = 0xafafb0;
  var time_fontSize = function () {
    return this.W * 0.04;
  }
  var time_translateY = function () {
    return this.prevChildBottom + this.H * 0.01;
  }
  var time_translateX = function () {
    return this.prevChildCenterX - this.width / 2;
  }
  var time_style = {
    font: {
      fontSize: time_fontSize,
      fill: time_fill
    },
    transform: {
      translateY: time_translateY,
      translateX: time_translateX
    }
  }
  //#endregion
  //#region label style
  var label_fill = 0x7b7b7b;
  var label_fontSize = time_fontSize;
  var label_translateY = time_translateY;
  var label_translateX = time_translateX;
  var label_style = {
    font: {
      fontSize: label_fontSize,
      fill: label_fill
    },
    transform: {
      translateY: label_translateY,
      translateX: label_translateX
    }
  }
  //#endregion
  return {
    f_submitd_expected_line_style: {
      scale: {
        width() {
          return span_width * this.W
        },
        height() {
          return 0.0025 * this.H
        },
      },
      transform: {
        translateX: `#x-center`,
        translateY() {
          return this.H * offset_y;
        }
      },
      tileScale: {
        scale() {
          return 0.013 * this.W / this.target.texture.width;
        }
      }
    },
    f_submitd_light_style: {
      scale: {
        scale: light_scale
      },
      transform: {
        translateX() {
          return this.W * (1 - span_width) / 2 - this.width / 2;
        },
        translateY: light_translateY
      }
    },
    f_expected_light_style: {
      scale: {
        scale: light_scale
      },
      transform: {
        translateX() {
          return this.W * ((1 - span_width) / 2 + span_width) - this.width / 2;
        },
        translateY: light_translateY
      }
    },
    f_submitd_time_style: time_style,
    f_expected_time_style: time_style,
    f_submitd_label_style: label_style,
    f_expected_label_style: label_style,
    f_submitd_style: {},
    f_expected_style: {},
  }
})());
