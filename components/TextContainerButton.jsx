const { React, getModuleByDisplayName, getModule } = require("powercord/webpack");
const { Button } = require("powercord/components");

const Tooltip = getModuleByDisplayName("Tooltip", false);
const buttonClasses = getModule(["button"], false);
const buttonWrapperClasses = getModule(["buttonWrapper", "pulseButton"], false);
const buttonTextAreaClasses = getModule(["button", "textArea"], false);

module.exports = React.memo(({ settings }) => {
  const [enabled, setEnabled] = React.useState(settings.get("nazify", true));
  return (
    <>
      <Tooltip text={`${enabled ? "Disable" : "Enable"} Grammar Nazi`} position="top">
        {({ onMouseLeave, onMouseEnter }) => (
          <Button
            look={Button.Looks.BLANK}
            size={Button.Sizes.ICON}
            onClick={() => {
              const after = !enabled;
              settings.set("nazify", after);
              setEnabled(after);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className={`${buttonClasses.contents} ${buttonWrapperClasses.button} ${buttonTextAreaClasses.button}`}>
              <svg className={`grammar-nazi-toggle-${enabled ? "active" : "inactive"} ${buttonWrapperClasses.icon}`} width="24px" height="24px">
                <polygon
                  fill="currentColor"
                  transform="translate(-4,-4.4), scale(0.9)"
                  points="21.1059,7.71462 10.3929,18.4277 18.4277,26.4625 26.4624,18.4277 23.7842,15.7494 18.4277,21.106 15.7494,18.4277 23.7841,10.3929 31.819,18.4277 18.4277,31.8191 5.03626,18.4277 18.4277,5.03633 "
                />
              </svg>
            </div>
          </Button>
        )}
      </Tooltip>
    </>
  );
});
