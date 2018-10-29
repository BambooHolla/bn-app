module.exports = {
  c_payer_content_style: {
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
        return (0.3 * this.W) / this.target.width
      },
    },
    transform: {
      translateX() {
        return this.W * 0.985 - this.target.width
      },
      translateY() {
        return this.H * 0.225
      },
    }
  },
  f_submitd_expected_line_style: {},
  f_submitd_light_style: {},
  f_submitd_time_style: {},
  f_submitd_label_style: {},
  f_submitd_style: {},
  f_expected_light_style: {},
  f_expected_time_style: {},
  f_expected_label_style: {},
  f_expected_style: {},
};
