import fetch from 'isomorphic-fetch';
import gql from 'graphql-tag';
import { Machine, send, assign } from 'xstate';
import { client } from '../utils/client';

const loadEffectPayload = async ({ url, name, channel, userID }) => {
  try {
    const data = await fetch(`${url}/.netlify/functions/${name}`, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({
        command: name,
        args: [],
        message: '',
        author: {
          id: 1,
          username: 'SocketStudio',
          roles: ['BROADCASTER', 'SUBSCRIBER', 'MODERATOR'],
        },
        extra: { channel },
      }),
    }).then(response => response.json());

    if (!data?.name) {
      throw new Error(`No command found for ${name}`);
    }

    // we need to save these in Hasura so the overlays can look them up without
    // needing to generate OAuth credentials
    await client
      .mutate({
        mutation: gql`
          mutation SaveEffects(
            $channel: String!
            $command: String!
            $handler: String!
            $userID: Int!
            $key: String!
          ) {
            insert_effects(
              objects: {
                channel: $channel
                command: $command
                handler: $handler
                user_id: $userID
                key: $key
              }
              on_conflict: {
                constraint: effects_key_key
                update_columns: [command, handler]
              }
            ) {
              affected_rows
            }
          }
        `,
        variables: {
          channel,
          userID,
          key: `${channel}#${data.name}`,
          command: data.name,
          handler: `${url}/.netlify/functions/${name}`,
        },
      })
      .catch(err => console.error(err));

    return data;
  } catch (error) {
    console.info(`${name} is not a valid Socket Studio handler.`);
  }
};

const effectMachine = Machine({
  id: 'effect',
  initial: 'loading',
  context: {
    userID: undefined,
    channel: undefined,
    url: undefined,
    name: undefined,
    description: undefined,
  },
  states: {
    loading: {
      invoke: {
        src: ({ url, channel, name, userID }) =>
          loadEffectPayload({ url, channel, name, userID }),
        onDone: {
          actions: [
            assign((_ctx, event) => ({ ...event.data })),
            send('RESOLVE'),
          ],
        },
        onError: {
          actions: send('REJECT'),
        },
      },
      on: {
        RESOLVE: 'success',
        REJECT: 'failure',
      },
    },
    success: {
      type: 'final',
    },
    failure: {},
    invalid: {},
  },
});

export default effectMachine;
