const { Plugin } = require("powercord/entities");
const { inject, uninject } = require("powercord/injector");
const { getModule, messages, getModuleByDisplayName, React } = require("powercord/webpack");
const { findInReactTree } = require("powercord/util");
const { receiveMessage } = messages;

const HeaderBarButton = require("./components/HeaderBarButton");
const TextContainerButton = require("./components/TextContainerButton");

module.exports = class GrammarNazi extends Plugin {
  async import(module, key = module) {
    this[key] = (await getModule([module]))[key];
  }

  get regex() {
    const dictionary = this.settings.get("customDictionary", {});
    const keywords = Object.keys(dictionary).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!keywords.length) return null;
    return new RegExp(`(^|(?<=[^A-Z0-9]+))(${keywords.join("|")})((?=[^A-Z0-9]+)|$)`, "gi");
  }

  async startPlugin() {
    await this.import("BOT_AVATARS");
    await this.import("createBotMessage");
    await this.import("getLastSelectedChannelId", "getChannelId");

    powercord.api.settings.registerSettings("GrammarNazi", {
      category: this.entityID,
      label: "GrammarNazi",
      render: require("./components/Settings")
    });

    powercord.api.commands.registerCommand({
      command: "addword",
      aliases: ["aw", "aword"],
      description: "Add a key/value pair to the custom dictionary.",
      usage: '{c} "key" "value"',
      executor: this.addDict.bind(this)
    });

    powercord.api.commands.registerCommand({
      command: "removeword",
      aliases: ["rm", "rmword"],
      description: "Remove a key/value pair from the custom dictionary.",
      usage: '{c} "key"',
      executor: this.removeDict.bind(this)
    });

    powercord.api.commands.registerCommand({
      command: "listwords",
      aliases: ["lw", "dictionary", "dict"],
      description: "View the current custom dictionary.",
      usage: "{c}",
      executor: this.viewDict.bind(this)
    });

    this.loadStylesheet("style.css");

    this.settings.set("customDictionary", this.settings.get("customDictionary", {}));
    ["nazify", "punctuation", "capitalization", "dictionary", "location"].forEach(s => this.settings.set(s, this.settings.get(s, false)));

    inject(
      "message-send",
      messages,
      "sendMessage",
      args => {
        let { content } = args[1];

        const dict = this.settings.get("customDictionary", {});

        if (!content.includes("```") && this.settings.get("nazify") && /\w/.test(content.charAt(0))) {
          if (this.settings.get("dictionary")) {
            const re = this.regex;
            if (re !== null)
              content = content.replace(this.regex, m => {
                return dict[m.toLowerCase()] ?? m;
              });
          }
          if (this.settings.get("punctuation") && /[A-Z0-9]/i.test(content.charAt(content.length - 1))) {
            if (!content.startsWith("http", content.lastIndexOf(" ") + 1)) content += ".";
          }
          if (this.settings.get("capitalization") && !content.startsWith("http")) content = content.charAt(0).toUpperCase() + content.slice(1);
        }

        args[1].content = content;
        return args;
      },
      true
    );

    console.log(this);
    /* Inject Toggle Button */
    const ChannelTextAreaContainer = await getModule(m => m.type && m.type.render && m.type.render.displayName === "ChannelTextAreaContainer");
    inject("chat-button", ChannelTextAreaContainer.type, "render", (_, res) => {
      if (this.settings.get("location") !== "channel-text-area-container") return res;

      const props = findInReactTree(res, r => r && r.className && r.className.indexOf("buttons-") == 0);
      props.children.unshift(
        React.createElement(TextContainerButton, {
          settings: this.settings
        })
      );
      return res;
    });
    ChannelTextAreaContainer.type.render.displayName = "ChannelTextAreaContainer";

    const HeaderBarContainer = await getModuleByDisplayName("HeaderBarContainer");
    inject("header-bar", HeaderBarContainer.prototype, "render", (_, res) => {
      if (this.settings.get("location") === "header-bar-container") {
        res.props.toolbar.props.children.unshift(
          React.createElement(HeaderBarButton, {
            settings: this.settings
          })
        );
      }
      return res;
    });
  }

  pluginWillUnload() {
    powercord.api.commands.unregisterCommand("addword");
    powercord.api.commands.unregisterCommand("removeword");
    powercord.api.commands.unregisterCommand("listwords");
    powercord.api.settings.unregisterSettings("GrammarNazi");
    uninject("message-send");
    uninject("chat-button");
    uninject("header-bar");
    document.querySelectorAll(".toggle-button").forEach(e => (e.style.display = "none"));
  }

  async addDict(args) {
    const receivedMessage = this.createBotMessage(this.getChannelId(), {});

    this.BOT_AVATARS.GrammarNaziAvatar = "https://i.imgur.com/wUcHvh0.png";
    receivedMessage.author.username = "Grammar Nazi";
    receivedMessage.author.avatar = "GrammarNaziAvatar";

    /* String Formatting */
    let parsed;
    if (args.length === 2) {
      parsed = args;
    } else {
      parsed = args
        .join(" ")
        .match(/\"(.+?)\"\s*"(.+?)"/)
        ?.slice(1);
      console.log(parsed);
      console.log(args);
    }
    if (!parsed || !parsed[0].length || !parsed[1].length) {
      receivedMessage.content =
        "Insufficient arguments; both a keyword and value must be supplied. You must wrap both key and value in double quotes if they contain spaces.";
      return receiveMessage(receivedMessage.channel_id, receivedMessage);
    }
    let [key, value] = parsed;
    key = key.toLowerCase();

    /* Duplicate Check */
    const customDictionary = this.settings.get("customDictionary");

    if (customDictionary.hasOwnProperty(key)) {
      receivedMessage.content = `Entry "${key}" already exists!`;
    } else {
      /* Save to Dictionary */
      customDictionary[key] = value;
      this.settings.set("customDictionary", customDictionary);

      receivedMessage.content = `Entry "${key}" successfully created with value of "${value}".`;
    }

    return receiveMessage(receivedMessage.channel_id, receivedMessage);
  }

  async removeDict(args) {
    const receivedMessage = this.createBotMessage(this.getChannelId(), {});

    this.BOT_AVATARS.GrammarNaziAvatar = "https://i.imgur.com/wUcHvh0.png";
    receivedMessage.author.username = "Grammar Nazi";
    receivedMessage.author.avatar = "GrammarNaziAvatar";

    const customDictionary = this.settings.get("customDictionary");
    const key = args.join(" ").replace(/"/gm, "");

    if (customDictionary.hasOwnProperty(key)) {
      delete customDictionary[key];
      this.settings.set("customDictionary", customDictionary);
      receivedMessage.content = `Entry \`${key}\` was successfully deleted!`;
    } else {
      receivedMessage.content = `No such entry: \`${key}\``;
    }
    return receiveMessage(receivedMessage.channel_id, receivedMessage);
  }

  async viewDict() {
    const receivedMessage = this.createBotMessage(this.getChannelId(), {});

    this.BOT_AVATARS.GrammarNaziAvatar = "https://i.imgur.com/wUcHvh0.png";
    receivedMessage.author.username = "Grammar Nazi";
    receivedMessage.author.avatar = "GrammarNaziAvatar";

    /* Write Message */
    let customDictionary = this.settings.get("customDictionary");
    const entries = Object.entries(customDictionary);
    if (!entries.length) receivedMessage.content = "Your dictionary is empty!";
    else {
      let dictionary = ">>> ";

      for (const [key, val] of entries) {
        dictionary += `${key} -> ${val}\n`;
      }

      receivedMessage.content = dictionary;
    }

    return receiveMessage(receivedMessage.channel_id, receivedMessage);
  }
};
