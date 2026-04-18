import { gql } from '@apollo/client';

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

export const LOGIN_OR_REGISTER = gql`
  mutation LoginOrRegister($email: String!, $name: String) {
    loginOrRegister(email: $email, name: $name) { id email name }
  }
`;

export const TRACK_USAGE = gql`
  mutation TrackUsage($volumeId: Int!, $articleId: String!, $articleTitle: String, $category: String) {
    trackUsage(volumeId: $volumeId, articleId: $articleId, articleTitle: $articleTitle, category: $category)
  }
`;
