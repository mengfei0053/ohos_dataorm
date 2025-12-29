/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on IdentityScopeObject.java written by
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

import { IdentityScope } from './IdentityScope'

export class IdentityScopeObject <K, T> implements IdentityScope<K, T> {
    private map: Map<K, T>
    private maxSize: number = 1000

    public constructor(maxSize: number = 1000) {
        this.map = new Map<K, T>()
        this.maxSize = maxSize
    }

    public get(key: K): T{
        const ref = this.map.get(key)
        if (ref !== null && ref !== undefined) {
            // 刷新最近使用
            this.map.delete(key)
            this.map.set(key, ref)
        }
        return ref ?? null
    }

    public getNoLock(key: K): T{
        return this.get(key)
    }

    public put(key: K, entity: T) {
        if (this.map.has(key)) {
            this.map.delete(key)
        }
        this.map.set(key, entity)
        this.evictIfNeeded()
    }

    public putNoLock(key: K, entity: T) {
        this.put(key, entity)
    }

    public detach(key: K, entity: T): boolean {
        if (this.get(key) === entity && entity) {
            this.remove(key)
            return true
        }
        return false
    }

    public remove(key: K) {
        this.map.delete(key);
    }

    public clear() {
        this.map.clear();
    }

    private evictIfNeeded() {
        while (this.map.size > this.maxSize) {
            const oldestKey = this.map.keys().next().value
            this.map.delete(oldestKey)
        }
    }
}
