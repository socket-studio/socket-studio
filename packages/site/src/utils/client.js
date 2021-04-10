import ApolloClient from 'apollo-boost';
import fetch from 'isomorphic-fetch';
import { auth } from './auth';

export const client = new ApolloClient({
  fetch,
  uri: process.env.GATSBY_SOCKET_STUDIO_API,
  request: operation => operation.setContext({ headers: auth.authHeaders() }),
});
