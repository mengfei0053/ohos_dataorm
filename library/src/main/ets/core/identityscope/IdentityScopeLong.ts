/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on IdentityScopeLong.java written by
 * Copyright (C) 2011-2016 Markus Junginger, greenrobot (http://greenrobot.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {IdentityScope} from './IdentityScope'

export class IdentityScopeLong <Number, T> implements IdentityScope<number, T> {
  private map: Map<number, T>
  private maxSize: number = 1000;

  public constructor(maxSize: number = 1000) {
    this.map = new Map<number, T>()
    this.maxSize = maxSize
  }

  public get(key: number): T{
    return this.get2(key);
  }

  public getNoLock(key: number): T{
    return this.get2NoLock(key);
  }

  public get2(key: number): T{
    const value = this.map.get(key)
    if (value !== null && value !== undefined) {
      // 移动到最近使用（尾部）
      this.map.delete(key)
      this.map.set(key, value)
    }
    return value ?? null
  }

  public get2NoLock(key: number): T{
    return this.get2(key);
  }

  public put(key: number, entity: T) {
    this.put2(key, entity);
  }

  public putNoLock(key: number, entity: T) {
    this.put2NoLock(key, entity);
  }

  public put2(key: number, entity: T) {
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    this.map.set(key, entity)
    this.evictIfNeeded()
  }

  public put2NoLock(key: number, entity: T) {
    this.put2(key, entity)
  }

  public detach(key: number, entity: T): boolean {
    if (this.get(key) === entity && entity) {
      this.remove(key)
      return true
    }
    return false
  }

  public remove(key: number) {
    this.map.delete(key)
  }


  public clear() {
    this.map.clear();
  }

  // LRU 淘汰策略
  private evictIfNeeded() {
    while (this.map.size > this.maxSize) {
      const oldestKey = this.map.keys().next().value
      this.map.delete(oldestKey)
    }
  }
}
