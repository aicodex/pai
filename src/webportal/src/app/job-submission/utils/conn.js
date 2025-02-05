// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import { clearToken } from '../../user/user-logout/user-logout.component.js';
import config from '../../config/webportal.config';
import yaml from 'js-yaml';
import { get } from 'lodash';
import urljoin from 'url-join';
import { getDeshuttleStorageDetails } from './utils';
import queryString from 'query-string';

const token = cookies.get('token');

const client = new PAIV2.OpenPAIClient({
  rest_server_uri: new URL(config.restServerUri, window.location.href),
  username: cookies.get('user'),
  token: token,
  https: window.location.protocol === 'https:',
});

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      alert(err.data.message);
      clearToken();
    } else if (err.data.code === 'NoJobConfigError') {
      throw new NotFoundError(err.data.message);
    } else {
      throw new Error(err.data.message);
    }
  }
};

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function submitJob(jobProtocol) {
  const job = yaml.safeLoad(jobProtocol);
  return wrapper(() => client.job.createJob(job));
}

export async function fetchJobConfig(userName, jobName) {
  return wrapper(() => client.job.getJobConfig(userName, jobName));
}

export async function getUserInstanceLimit(user) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'instancelimit', 1);
}

export async function getUserSkuLimit(user) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'skulimit', '8');
}

export async function listUserVirtualClusters(user) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'virtualCluster', []);
}

export async function listHivedSkuTypes(virtualCluster) {
  if (config.launcherScheduler !== 'hivedscheduler') {
    return {};
  }
  return wrapper(async () =>
    (await fetch(
      urljoin(
        config.restServerUri,
        `/api/v2/cluster/sku-types?vc=${virtualCluster}`,
      ),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )).json(),
  );
}

export async function fetchUserGroup(api, user, token) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'grouplist', []);
}

export async function listUserStorageConfigs(user) {
  return wrapper(async () => {
    const userInfo = await client.user.getUser(user);
    return userInfo.storageConfig || [];
  });
}

export async function fetchStorageDetails(configNames) {
  return wrapper(async () => {
    const storageSummary = await client.storage.getStorages();
    const defaultStorages = await client.storage.getStorages(true);
    const defaultStorageNames = defaultStorages.storages.map(x => x.name);
    const details = [];
    for (const storage of storageSummary.storages) {
      if (configNames.includes(storage.name)) {
        const detail = await client.storage.getStorage(storage.name);
        if (defaultStorageNames.includes(detail.name)) {
          detail.default = true;
        }
        if (detail.type === 'dshuttle') {
          const res = await fetch('dshuttle/api/v1/master/info', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const json = await res.json();
            if (
              detail.data.dshuttlePath &&
              json.mountPoints[detail.data.dshuttlePath]
            ) {
              detail.data = {
                ...detail.data,
                ...getDeshuttleStorageDetails(
                  json.mountPoints[detail.data.dshuttlePath],
                ),
              };
            }
          }
        }
        details.push(detail);
      }
    }
    return details;
  });
}

export async function fetchMyTemplates(user) {
  const queryOptions = {};
  queryOptions.author = user;
  queryOptions.source = 'pai';
  const queryStr = queryString.stringify(queryOptions);
  const url = urljoin(config.marketplaceUri, `items?${queryStr}`);
  const token = cookies.get('token');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) {
    const items = await res.json();
    // order by updateDate
    items.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return items;
  } else {
    throw new Error(res.statusText);
  }
}

export async function createTemplate(marketItem) {
  const url = urljoin(config.marketplaceUri, 'items');
  const token = cookies.get('token');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(marketItem),
  });
  if (res.ok) {
    const result = await res.json();
    return result.id;
  } else {
    throw new Error(res.statusText);
  }
}
