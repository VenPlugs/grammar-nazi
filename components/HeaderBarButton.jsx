const { React, getModuleByDisplayName, getModule } = require("powercord/webpack");

const Tooltip = getModuleByDisplayName("Tooltip", false);
const { icon, iconWrapper, clickable } = getModule(["iconWrapper", "clickable"], false);

module.exports = React.memo(({ settings }) => {
  const [enabled, setEnabled] = React.useState(settings.get("nazify", true));
  return (
    <>
      <Tooltip text={`${enabled ? "Disable" : "Enable"} Grammar Nazi`} position="bottom">
        {({ onMouseLeave, onMouseEnter }) => (
          <div className={`${iconWrapper} ${clickable}`}>
            <svg
              width="24px"
              height="24px"
              className={`grammar-nazi-toggle-${enabled ? "active" : "inactive"} ${icon}`}
              onClick={() => {
                settings.set("nazify", !enabled);
                setEnabled(!enabled);
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <polygon
                fill="currentColor"
                transform="translate(-3.5,-3.3), scale(0.83)"
                points="21.1059,7.71462 10.3929,18.4277 18.4277,26.4625 26.4624,18.4277 23.7842,15.7494 18.4277,21.106 15.7494,18.4277 23.7841,10.3929 31.819,18.4277 18.4277,31.8191 5.03626,18.4277 18.4277,5.03633 "
              />
            </svg>
          </div>
        )}
      </Tooltip>
    </>
  );
});
