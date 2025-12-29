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

import { hilog } from "@kit.PerformanceAnalysisKit";

export namespace LogUtil {
  let enable = true;

  export function setEnable(flag: boolean) {
    enable = flag;
  }

  export function info(...msg: any[]) {
    enable && hilog.info(0x0000, 'dataorm_demo', '%{public}s', msg);
  }

  export function error(...msg: any[]) {
    enable && hilog.error(0x0000, 'dataorm_demo', '%{public}s', msg);
  }

  export function debug(...msg: any[]) {
    enable && hilog.debug(0x0000, 'dataorm_demo', '%{public}s', msg);
  }

  export function warn(...msg: any[]) {
    enable && hilog.warn(0x0000, 'dataorm_demo', '%{public}s', msg);
  }

  export function fatal(...msg: any[]) {
    enable && hilog.fatal(0x0000, 'dataorm_demo', '%{public}s', msg);
  }
}