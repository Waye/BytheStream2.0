import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  type NormalizedCacheObject,
} from '@apollo/client';
import { Platform } from 'react-native';

const DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/graphql'
    : 'http://localhost:4000/graphql';

const PROD_URL = 'https://your-app.herokuapp.com/graphql';

const API_URL = __DEV__ ? DEV_URL : PROD_URL;

export const apolloClient: ApolloClient<NormalizedCacheObject> =
  new ApolloClient({
    link: new HttpLink({ uri: API_URL }),
    cache: new InMemoryCache({
      // 不做 volumes 的自动合并——分页由组件自己管理
      // 这样 offset:1,limit:6 和 offset:0,limit:4 不会互相污染
    }),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
