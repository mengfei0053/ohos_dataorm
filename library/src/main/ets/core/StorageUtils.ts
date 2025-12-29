/*
  * Copyright (c) 2022 Huawei Device Co., Ltd.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
    *
  * http://www.apache.org/licenses/LICENSE-2.0
    *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

import dataStorage from '@ohos.data.preferences'


export class StorageUtils {
  static ctx: ESObject;

  static async putValue(key: string, value: any, context?: any) {
    if (context) {
      StorageUtils.ctx = context;
    }
    if (StorageUtils.ctx) {
      let promise = await dataStorage.getPreferences(StorageUtils.ctx, 'mystore')
      promise.put(key, value)
      promise.flush()
    } else {
      throw new Error("StorageUtils:putValue error");
    }
  }
  
  static putValueSync(key: string, value: any, context?: any) {
    if (context) {
      StorageUtils.ctx = context;
    }
    if (StorageUtils.ctx) {
      let options: dataStorage.Options = { name: 'mystore' };
      let promise = dataStorage.getPreferencesSync(StorageUtils.ctx, options);
      promise.put(key, value)
      promise.flush()
    } else {
      throw new Error("StorageUtils:putValue error");
    }
  }

  static async getValueByKey(key: string, defaultValue: any, context?: any): Promise<any> {
    if (context) {
      StorageUtils.ctx = context;
    }
    if (StorageUtils.ctx) {
      let promise = await dataStorage.getPreferences(StorageUtils.ctx, 'mystore')
      let value = promise.get(key, defaultValue)
      promise.flush()
      return value
    } else {
      throw new Error("StorageUtils:getValueByKey error");
    }
  }

  static getValueByKeySync(key: string, defaultValue: any, context?: any): any {
    if (context) {
      StorageUtils.ctx = context;
    }
    if (StorageUtils.ctx) {
      let options: dataStorage.Options = { name: 'mystore' };
      let promise = dataStorage.getPreferencesSync(StorageUtils.ctx, options);
      let value = promise.getSync(key, defaultValue)
      promise.flush()
      return value
    } else {
      throw new Error("StorageUtils:getValueByKey error");
    }
  }
}
