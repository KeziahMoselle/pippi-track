const { MessageEmbed } = require('discord.js')
const osu = require('../libs/osu')
const supabase = require('../libs/supabase')

class TrackCommand {
  name = 'track'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof TrackCommand
   */
   async run (message, args) {
    // Allow username with whitespaces
    const username = args.join(' ')

    try {
      const user = await osu.getUser({
        u: username
      })

      const { data: userFound } = await supabase
        .from('users')
        .select('user_id').eq('user_id', user.id)

      // If we find a result there is already a player tracked.
      if (userFound.length > 0) {
        const embed = new MessageEmbed()
        .setTitle('Player already tracked')
        .setDescription(`**${user.name}** is already being tracked.`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)

        return message.channel.send(embed)
      }

      // Track the user
      const { error } = await supabase
        .from('users')
        .insert([{
          user_id: user.id,
          username: user.name
        }])

      if (error) {
        console.error(error)
        message.reply('Sorry, there was an error.')
      }

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${username}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = TrackCommand