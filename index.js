const { Plugin }  = require('powercord/entities')
const { inject, uninject } = require('powercord/injector')
const { getModule: getMod, messages, getModuleByDisplayName, React } = require('powercord/webpack')
const getModule = (key, sync) => getMod(typeof key === "string" ? [key] : key, sync);
const { findInReactTree } = require('powercord/util')
const { receiveMessage } = messages

const HeaderBarButton = require('./components/HeaderBarButton')
const TextContainerButton = require('./components/TextContainerButton')

module.exports = class GrammarNazi extends Plugin {
  async startPlugin() {
      powercord.api.settings.registerSettings("GrammarNazi", {
        category: this.entityID,
        label: "GrammarNazi",
        render: require('./components/Settings')
      });
  
  
    powercord.api.commands.registerCommand({
      command: 'addword',
      aliases: ['aw', 'aword'],
			description: 'Add a key/value pair to the custom dictionary.',
			usage: '{c} "key" "value"',
			executor: (args) => this.addDict(args)
    })
    powercord.api.commands.registerCommand({
      command: 'removeword',
      aliases: ['rm', 'rmword'],
			description: 'Remove a key/value pair from the custom dictionary.',
			usage: '{c} "key"',
			executor: (args) => this.removeDict(args)
		})
		powercord.api.commands.registerCommand({
      command: 'listwords',
      aliases: ['lw', 'dictionary', 'dict'],
			description: 'View the current custom dictionary.',
			usage: '{c}',
			executor: () => this.viewDict()
    })

    /* Stylesheet */
    this.loadStylesheet("style.css")

    /* Define Settings */
    if (this.settings.get('customDictionary') === undefined) this.settings.set('customDictionary', {})
    let settingsArray = ['nazify', 'punctuation', 'capitalization', 'dictionary', 'location']
    for (let i = 0; i < settingsArray.length; i++) {
      if (this.settings.get(settingsArray[i]) === undefined) this.settings.set(settingsArray[i], false)
    }

    /* Inject on Message Send */
		inject('message-send', messages, 'sendMessage', (args) => {
      let text = args[1].content.trim()
      let split = text.split(' ')
      let customDictionary = this.settings.get('customDictionary')

      if (text.indexOf('```') === -1 && this.settings.get('nazify') && text.charAt(0) !== '.') {
      if (this.settings.get('dictionary')) text = split.map(c => c in customDictionary ? customDictionary[c] : c).join(' ')
      if (this.settings.get('punctuation') && (/[a-z0-9]$/gmi).test(text) && split[split.length-1].indexOf('http') === -1 ) text += '.'
      if (this.settings.get('capitalization') && text.indexOf('http') != 0) text = text.charAt(0).toUpperCase() + text.substring(1)}

      args[1].content = text
      return args
    }, true)

    /* Inject Toggle Button */
    const ChannelTextAreaContainer = getModule((m) => m.type && m.type.render && m.type.render.displayName === 'ChannelTextAreaContainer', false)
    inject('chat-button', ChannelTextAreaContainer.type, 'render', (args, res) => {
      if (this.settings.get('location') === 'channel-text-area-container') {
        const props = findInReactTree(res, (r) => r && r.className && r.className.indexOf('buttons-') == 0)
        props.children.unshift(React.createElement(TextContainerButton, { settings: this.settings }))
      }
        return res
    })
    ChannelTextAreaContainer.type.render.displayName = 'ChannelTextAreaContainer'
    
    const HeaderBarContainer = await getModuleByDisplayName('HeaderBarContainer')
    inject('header-bar', HeaderBarContainer.prototype, 'render', (args, res)=> {
      if (this.settings.get('location') === 'header-bar-container')
        res.props.toolbar.props.children.unshift(React.createElement(HeaderBarButton, { settings: this.settings, bartype: HeaderBarContainer.Icon }))
      return res
    })
}

    pluginWillUnload() {
      powercord.api.commands.unregisterCommand('addword')
      powercord.api.commands.unregisterCommand('removeword')
      powercord.api.commands.unregisterCommand('listwords')
      powercord.api.settings.unregisterSettings("GrammarNazi")
      uninject('message-send')
      uninject('chat-button')
      uninject('header-bar')
      document.querySelectorAll('.toggle-button').forEach(e => e.style.display = 'none')
    }

    async addDict(args) {
      /* Custom Bot Attributes */
      const { BOT_AVATARS } = await getModule('BOT_AVATARS')
      const { createBotMessage } = await getModule('createBotMessage')
      const { getChannelId } = getModule('getLastSelectedChannelId', false)

      const receivedMessage = createBotMessage(getChannelId(), {})

      BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
      receivedMessage.author.username = 'Grammar Nazi'
      receivedMessage.author.avatar = 'GrammarNaziAvatar'

      /* String Formatting */
      let newargs = []
      let text = args.join(' ')
      newargs[0] = text.substring(0, text.indexOf('" "')).replace(/"/g, '')
      newargs[1] = text.substring(text.indexOf('" "') + 2, text.length).replace(/"/g, '')
      if (newargs[0].length < 1 || newargs[1] == ' ') {
        receivedMessage.content = 'Insufficent arguments; both a keyword and value must be supplied.'
        return receiveMessage(receivedMessage.channel_id, receivedMessage)
      }

      /* Duplicate Check */
      let customDictionary = this.settings.get('customDictionary')
      if (newargs[0] in customDictionary) {
        receivedMessage.content = `Entry "${newargs[0]}" already exists!`
        return receiveMessage(receivedMessage.channel_id, receivedMessage)
      }

      /* Save to Dictionary */
      customDictionary[newargs[0]] = newargs[1]
      this.settings.set('customDictionary', customDictionary)

      receivedMessage.content = `Entry "${newargs[0]}" successfully created with value of "${newargs[1]}".`
      return receiveMessage(receivedMessage.channel_id, receivedMessage)
    }

    async removeDict(args) {
      /* Custom Bot Attributes */
      const { BOT_AVATARS } = await getModule('BOT_AVATARS')
      const { createBotMessage } = await getModule('createBotMessage')
      const { getChannelId } = getModule('getLastSelectedChannelId', false)

      const receivedMessage = createBotMessage(getChannelId(), {})

      BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
      receivedMessage.author.username = 'Grammar Nazi'
      receivedMessage.author.avatar = 'GrammarNaziAvatar'

      /* String Formatting */
      let customDictionary = this.settings.get('customDictionary')
      let text = args.join(' ').replace(/"/gm, '')

      /* Arguments Check */
      if (!(args.join(' ').includes('"'))) {
        receivedMessage.content = 'Insufficent arguments; please provide a keyword that exists in the dictionary.'
        return receiveMessage(receivedMessage.channel_id, receivedMessage)
      }

      /* Remove from Dictionary */
      if (text in customDictionary) {
        delete customDictionary[text]
        this.settings.set('customDictionary', customDictionary)
        receivedMessage.content = `Entry ${args[0]} was successfully deleted!`
        return receiveMessage(receivedMessage.channel_id, receivedMessage)
      } else {
        receivedMessage.content = `Entry ${args[0]} does not exist.`
        return receiveMessage(receivedMessage.channel_id, receivedMessage)
      }
    }

	  async viewDict() {
      /* Custom Bot Attributes */
      const { BOT_AVATARS } = await getModule('BOT_AVATARS')
      const { createBotMessage } = await getModule('createBotMessage')
      const { getChannelId } = getModule('getLastSelectedChannelId', false)

      const receivedMessage = createBotMessage(getChannelId(), {})

      BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
      receivedMessage.author.username = 'Grammar Nazi'
      receivedMessage.author.avatar = 'GrammarNaziAvatar'

      /* Write Message */
      let customDictionary = this.settings.get('customDictionary')
      let dictionary = '> '

      for (let i in customDictionary) {
        dictionary += i + ' : ' + customDictionary[i] + '\n> '
      }

      receivedMessage.content = dictionary
      return receiveMessage(receivedMessage.channel_id, receivedMessage)
    }
}
