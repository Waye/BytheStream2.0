import { gql } from '@apollo/client';

// ─────────────────────────── Fragments ───────────────────────────
export const ARTICLE_FIELDS = gql`
  fragment ArticleFields on Article {
    id slug volume title author category mins firstImage
  }
`;

export const ARTICLE_FULL = gql`
  fragment ArticleFull on Article {
    ...ArticleFields
    content
  }
  ${ARTICLE_FIELDS}
`;

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id email name avatar provider createdAt
  }
`;

export const FAVORITE_FIELDS = gql`
  fragment FavoriteFields on Favorite {
    id articleId volume slug title author category createdAt
  }
`;

export const AUDIO_EPISODE_FIELDS = gql`
  fragment AudioEpisodeFields on AudioEpisode {
    id title author volume durationSeconds coverImage streamUrl streamExpiresAt
  }
`;

// ─────────────────────────── 期刊 / 文章 ───────────────────────────
export const GET_LATEST_VOLUME = gql`
  query GetLatestVolume { latestVolume }
`;

export const GET_ARTICLES_BY_VOLUME = gql`
  query GetArticlesByVolume($volume: Int!, $character: String!) {
    articlesByVolume(volume: $volume, character: $character) {
      ...ArticleFields
    }
  }
  ${ARTICLE_FIELDS}
`;

export const GET_ARTICLE = gql`
  query GetArticle($volume: Int!, $slug: String!) {
    article(volume: $volume, slug: $slug) { ...ArticleFull }
  }
  ${ARTICLE_FULL}
`;

export const GET_VOLUME = gql`
  query GetVolume($id: Int!) {
    volume(id: $id) { id subtitle count coverSlug coverImage }
  }
`;

export const GET_VOLUMES = gql`
  query GetVolumes($offset: Int!, $limit: Int!) {
    volumes(offset: $offset, limit: $limit) { id subtitle count coverSlug coverImage }
  }
`;

export const SEARCH_ARTICLES = gql`
  query SearchArticles($query: String!, $character: String!, $limit: Int, $offset: Int) {
    search(query: $query, character: $character, limit: $limit, offset: $offset) {
      total
      articles { ...ArticleFields }
    }
  }
  ${ARTICLE_FIELDS}
`;

export const TRACK_USAGE = gql`
  mutation TrackUsage($volumeId: Int!, $articleId: String!, $articleTitle: String, $category: String) {
    trackUsage(volumeId: $volumeId, articleId: $articleId, articleTitle: $articleTitle, category: $category)
  }
`;

// ─────────────────────────── 认证 ───────────────────────────
export const ME = gql`
  query Me {
    me { ...UserFields }
  }
  ${USER_FIELDS}
`;

export const LOGIN_WITH_GOOGLE = gql`
  mutation LoginWithGoogle($idToken: String!) {
    loginWithGoogle(idToken: $idToken) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN_WITH_FACEBOOK = gql`
  mutation LoginWithFacebook($accessToken: String!) {
    loginWithFacebook(accessToken: $accessToken) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN_OR_REGISTER = gql`
  mutation LoginOrRegister($email: String!, $name: String) {
    loginOrRegister(email: $email, name: $name) {
      token
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const LOGOUT = gql`
  mutation Logout { logout }
`;

// ─────────────────────────── 文章收藏（云端） ───────────────────────────
export const MY_FAVORITES = gql`
  query MyFavorites {
    myFavorites { ...FavoriteFields }
  }
  ${FAVORITE_FIELDS}
`;

export const ADD_FAVORITE = gql`
  mutation AddFavorite(
    $articleId: String!
    $title: String!
    $author: String
    $category: String
  ) {
    addFavorite(
      articleId: $articleId
      title: $title
      author: $author
      category: $category
    ) { ...FavoriteFields }
  }
  ${FAVORITE_FIELDS}
`;

export const REMOVE_FAVORITE = gql`
  mutation RemoveFavorite($articleId: String!) {
    removeFavorite(articleId: $articleId)
  }
`;

// ─────────────────────────── 音频（接口占位） ───────────────────────────
export const GET_AUDIO_EPISODE = gql`
  query GetAudioEpisode($id: ID!) {
    audioEpisode(id: $id) { ...AudioEpisodeFields }
  }
  ${AUDIO_EPISODE_FIELDS}
`;

export const GET_AUDIO_EPISODES = gql`
  query GetAudioEpisodes($volume: Int) {
    audioEpisodes(volume: $volume) { ...AudioEpisodeFields }
  }
  ${AUDIO_EPISODE_FIELDS}
`;
