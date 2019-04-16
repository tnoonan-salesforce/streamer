import {core, flags, SfdxCommand} from '@salesforce/command';
import { StatusResult, StreamingClient } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import {AnyJson, isNumber, JsonMap} from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('@amphro/streamer', 'channel');

export class Streamer extends SfdxCommand {

  public static description = messages.getMessage('stream.commandDescription');

  public static examples = [messages.getMessage('stream.example1')];

  public static args = [{name: 'channel', require}];

  protected static flagsConfig = {
    replayid: flags.integer({char: 'r', description: messages.getMessage('stream.replayIdFlagDescription')})
  };

  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    await this.steamEvent();
    return {};
  }

  public async getClient() {
    const options = new StreamingClient.DefaultOptions(this.org, this.args.channel, this.streamProcessor.bind(this));
    const time = Duration.minutes(30);
    options.setSubscribeTimeout(time);
    return StreamingClient.create(options);
  }

  private async steamEvent() {
    const asyncStatusClient = await this.getClient();

    if (isNumber(this.flags.replayid)) {
        asyncStatusClient.replay(this.flags.replayid);
    }

    await asyncStatusClient.handshake();
    this.ux.log('Listening... (ctrl-c to exit)');
    await asyncStatusClient.subscribe(async () => {});
  }

  private streamProcessor = (message: JsonMap): StatusResult => {
    this.ux.logJson(message);
    return { completed: false };
  };
}
