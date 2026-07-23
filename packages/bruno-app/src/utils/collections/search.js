import { flattenItems, isItemARequest, isItemAFolder } from './index';
import filter from 'lodash/filter';
import find from 'lodash/find';

export const doesRequestMatchSearchText = (request, searchText = '') => {
  const term = searchText.trim().toLowerCase();
  if (!term) return true;

  const name = request?.name?.toLowerCase() || '';
  const url = request?.request?.url?.toLowerCase() || '';

  return name.includes(term) || url.includes(term);
};

export const doesFolderHaveItemsMatchSearchText = (item, searchText = '') => {
  const term = searchText.trim().toLowerCase();
  if (!term) return true;

  // Match the folder name itself
  if (item?.name?.toLowerCase().includes(term)) {
    return true;
  }

  let flattenedItems = flattenItems(item.items);
  let requestItems = filter(flattenedItems, (item) => isItemARequest(item) && !item.isTransient);

  return find(requestItems, (request) => doesRequestMatchSearchText(request, searchText));
};

export const doesCollectionHaveItemsMatchingSearchText = (collection, searchText = '') => {
  const term = searchText.trim().toLowerCase();
  if (!term) return true;

  // Match the collection name itself
  if (collection?.name?.toLowerCase().includes(term)) {
    return true;
  }

  let flattenedItems = flattenItems(collection.items);
  let requestItems = filter(flattenedItems, (item) => isItemARequest(item) && !item.isTransient);

  return find(requestItems, (request) => doesRequestMatchSearchText(request, searchText));
};
