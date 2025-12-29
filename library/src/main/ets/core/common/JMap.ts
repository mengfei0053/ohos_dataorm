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

/*
 * MAP对象，实现MAP功能
 *
 * 接口：
 * size()     获取MAP元素个数
 * isEmpty()    判断MAP是否为空
 * clear()     删除MAP所有元素
 * put(key, value)   向MAP中增加元素（key, value)
 * remove(key)    删除指定KEY的元素，成功返回True，失败返回False
 * get(key)    获取指定KEY的元素值VALUE，失败返回NULL
 * element(index)   获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL
 * containsKey(key)  判断MAP中是否含有指定KEY的元素
 * containsValue(value) 判断MAP中是否含有指定VALUE的元素
 * values()    获取MAP中所有VALUE的数组（ARRAY）
 * keys()     获取MAP中所有KEY的数组（ARRAY）
 *
 * 例子：
 * var map = new Map(string,string);
 *
 * map.put("key", "value");
 * var val = map.get("key")
 * ……
 *
 */
class Node <T1, T2> {
    constructor(_key: T1, _value: T2) {
        this.key = _key
        this.value = _value
    }

    key: T1
    value: T2
}

export class JMap <T1, T2> {
    private map: Map<T1, T2>;

    constructor() {
        this.map = new Map();
    }

    // 获取MAP元素个数
    size(): number {
        return this.map.size;
    };

    // 判断MAP是否为空
    isEmpty(): boolean {
        return this.map.size === 0;
    }

    // 删除MAP所有元素
    clear(): void {
        this.map.clear();
    }

    // 向MAP中增加元素（key, value)
    put(_key: T1, _value: T2): void {
       this.map.set(_key, _value);
    }

    // 获取指定KEY的元素值VALUE，失败返回NULL
    get(_key: T1): T2 {
      return this.map.get(_key) ?? null;
    }

    // 获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL
    element(_index: number): Node<T1, T2> {
        const entry = Array.from(this.map.entries())[_index];
        if (!entry) return null;
        return { key: entry[0], value: entry[1] };
    };

    // 删除指定KEY的元素，成功返回True，失败返回False
    removeByKey(_key: T1): boolean {
        return this.map.delete(_key);
    };

    // 删除指定VALUE的元素，成功返回True，失败返回False
    removeByValue(_value: T2): boolean { // removeByValueAndKey
      for (const [k, v] of this.map.entries()) {
        if (v === _value) {
          this.map.delete(k);
          return true;
        }
      }
      return false;
    };

    // 删除指定VALUE的元素，成功返回True，失败返回False
    removeByValueAndKey(_key: T1, _value: T2): boolean {
        const val = this.map.get(_key);
        if (val === _value) {
            this.map.delete(_key);
            return true;
        }
        return false;
    };

    // 判断MAP中是否含有指定KEY的元素
    containsKey(_key: T1): boolean {
        return this.map.has(_key);
    };

    // 判断MAP中是否含有指定VALUE的元素
    containsValue(_value: T2): boolean {
        for (const value of this.map.values()) {
            if (value === _value) return true;
        }
        return false;
    }

    // 判断MAP中是否含有指定VALUE的元素
    containsObj(_key: T1, _value: T2): boolean {
        const val = this.map.get(_key);
        return val === _value;
    };

    // 获取MAP中所有VALUE的数组（ARRAY）
    values(): Array<T2> {
        return Array.from(this.map.values());
    };

    // 获取MAP中所有VALUE的数组（ARRAY）
    valuesByKey(_key: T1): Array<T2> {
        const val = this.map.get(_key);
        return (val !== undefined && val !== null) ? [val] : [];
    };

    // 获取MAP中所有KEY的数组（ARRAY）
    keys(): Array<T1> {
        return Array.from(this.map.keys());
    };

    // 获取key通过value
    keysByValue(_value: T2): Array<T1> {
        const result: T1[] = [];
        for (const [k, v] of this.map.entries()) {
            if (v === _value) result.push(k);
        }
        return result;
    };

    // 获取MAP中所有KEY的数组（ARRAY）
    keysRemoveDuplicate(): Array<T1> {
        return this.keys(); // 原生 Map 键就是唯一的
    }
}