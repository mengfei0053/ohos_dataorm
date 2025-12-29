/*
  * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import { LogUtil } from "./LogUtil";

export function TaskTime(tag: string = "", onlyTime: boolean = false) {
  return function (target: ESObject, propertyKey: string, descriptor: PropertyDescriptor) {
    let originalMethod: Function = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (onlyTime) {
        LogUtil.info(`${tag ?? ''} [TaskTime] > Call "${propertyKey}"`);
      } else {
        LogUtil.info(`${tag ?? ''} [TaskTime] > Call "${propertyKey}" with arguments:`,
          onlyTime ? '' : JSON.stringify(args));
      }
      const start = Date.now();
      const result = originalMethod.apply(this, args);
      if (result instanceof Promise) {
        return result.then((res) => {
          const end = Date.now();
          if (onlyTime) {
            LogUtil.info(`${tag ?? ''} [TaskTime] < "${propertyKey}" ${(end - start).toFixed(2)}ms`);
          } else {
            LogUtil.info(`${tag ?? ''} [TaskTime] < "${propertyKey}" ${(end - start).toFixed(2)}ms returned:`,
              JSON.stringify(res));
          }
          return res;
        });
      } else {
        const end = Date.now();
        if (onlyTime) {
          LogUtil.info(`${tag ?? ''} [TaskTime] < "${propertyKey}" ${(end - start).toFixed(2)}ms`);
        } else {
          LogUtil.info(`${tag ?? ''} [TaskTime] < "${propertyKey}" ${(end - start).toFixed(2)}ms returned:`,
            JSON.stringify(result));
        }
        return result;
      }
    }
    return descriptor;
  }
}