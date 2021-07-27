import { MessageEmbed, Message } from 'discord.js'
import { defaultPrefix } from '../config'
import supabase from '../libs/supabase'

interface ChannelToAddInterface {
  track_channel?: string
  updates_channel?: string
  replay_channel?: string
  admin_channel?: string
}

export default class SetChannelCommand {
  name = 'set'
  arguments = ['option', 'value']
  description =
    'Configure channels for tracking top plays, replays and administration, also allows you to change the bot prefix'

  category = 'general'
  prefixes = null

  CHANNEL_OPTIONS = [
    'track',
    'tracks',
    'updates',
    'update',
    'replay',
    'replays',
    'admin'
  ]

  constructor (prefixes) {
    this.prefixes = prefixes
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]) {
    const prefix = this.prefixes.get(message.guild.id) || defaultPrefix
    const [option] = args

    // If the option is not valid, send a help message
    if (!option) {
      const embed = new MessageEmbed()
        .setDescription(
          `Type \`${prefix}set track\` in your tracking channel to enable top plays tracking.\n` +
            `Type \`${prefix}set updates\` in your updates channel to enable daily osu!track updates.\n` +
            `Type \`${prefix}set replay\` in your replay channel to enable replay reposting from o!rdr.\n` +
            `Type \`${prefix}set admin\` in your administration channel to enable tracking requests from users. (if this is not set users can track themselves)\n` +
            `Type \`${prefix}set prefix <prefix>\` to set a new prefix for this server.`
        )
        .setColor(5814783)

      return message.channel.send(embed)
    }

    // Check permissions of the user
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        'You need to be an Administrator to use this command.'
      )
    }

    // If the option is about channels
    if (this.CHANNEL_OPTIONS.includes(option)) {
      const channelToAdd: ChannelToAddInterface = {}

      let channelToTrack = message.channel

      if (message?.mentions?.channels.size > 0) {
        channelToTrack = message.mentions.channels.first()
      }

      if (option === 'track' || option === 'tracks') {
        channelToAdd.track_channel = channelToTrack.id
      }

      if (option === 'update' || option === 'updates') {
        channelToAdd.updates_channel = channelToTrack.id
      }

      if (option === 'replay' || option === 'replays') {
        channelToAdd.replay_channel = channelToTrack.id
      }

      if (option === 'admin') {
        channelToAdd.admin_channel = channelToTrack.id
      }

      try {
        const { error } = await supabase
          .from('guilds')
          .upsert({
            guild_id: message.guild.id,
            ...channelToAdd
          })
          .eq('guild_id', message.guild.id)

        if (error) {
          message.reply('Sorry, there was an error')
        }

        const embed = new MessageEmbed()
          .setDescription(
            `Successfully set the **${option}** channel on ${channelToTrack.toString()}`
          )
          .setColor(11279474)

        return message.channel.send(embed)
      } catch (error) {
        console.error('Set command error:', error)
      }
    }

    if (option === 'prefix') {
      const prefix = args[1]

      const { error } = await supabase
        .from('guilds')
        .upsert({
          guild_id: message.guild.id,
          prefix
        })
        .eq('guild_id', message.guild.id)

      if (error) {
        console.error('Set prefix error :', error)
      }

      const embed = new MessageEmbed()
        .setDescription(`Successfully set the **${option}** to \`${prefix}\``)
        .setColor(11279474)

      this.prefixes.set(message.guild.id, prefix)

      return message.channel.send(embed)
    }

    const embed = new MessageEmbed()
      .setDescription(`Sorry, the option **${option}** does not exist.`)
      .setColor(14504273)

    return message.channel.send(embed)
  }
}
