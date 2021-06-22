const { React, getModuleByDisplayName } = require("powercord/webpack");

const Tooltip = getModuleByDisplayName("Tooltip", false);

module.exports = class HeaderBarButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.get = this.props.settings.get;
    this.set = this.props.settings.set;
    this.enabled = this.get("nazify", true);
  }

  render() {
    return (
      <>
        <Tooltip text={`${this.enabled ? "Disable" : "Enable"} Grammar Nazi`} position="bottom">
          {({ onMouseLeave, onMouseEnter }) => (
            <this.props.bartype
              icon={() => (
                <svg class="icon-22AiRD" width="24px" height="24px">
                  <polygon
                    fill="currentColor"
                    transform="translate(-3.5,-3.3), scale(0.83)"
                    points="21.1059,7.71462 10.3929,18.4277 18.4277,26.4625 26.4624,18.4277 23.7842,15.7494 18.4277,21.106 15.7494,18.4277 23.7841,10.3929 31.819,18.4277 18.4277,31.8191 5.03626,18.4277 18.4277,5.03633 "
                  />
                </svg>
              )}
              className={`toggle-button ${this.enabled ? "active" : "inactive"}`}
              onClick={() => {
                this.enabled = !this.enabled;
                this.set("nazify", this.enabled);
                this.forceUpdate();
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />
          )}
        </Tooltip>
      </>
    );
  }
};
