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

export class Queue<T> {
  private elements: Array<T>;
  private _size?: number;

  constructor(capacity?: number) {
    this.elements = new Array<T>();
    this._size = capacity;
  }

  add(o: T): boolean {
    if (o === null || o === undefined) {
      return false;
    }

    if (this._size !== undefined && this._size !== null && this.elements.length === this._size) {
      this.pop(); // 移除最后一个
    }

    this.elements.unshift(o); // 插入头部
    return true;
  }

  pop(): T | undefined {
    return this.elements.pop(); // 移除末尾
  }

  removeFirst(): T | undefined {
    return this.elements.shift(); // 移除头部
  }

  size(): number {
    return this.elements.length;
  }

  empty(): boolean {
    return this.elements.length === 0;
  }

  clear() {
    this.elements.length = 0;
  }

  getElements(): T[] {
    return this.elements;
  }

  clone(): Queue<T> {
    const q = new Queue<T>(this._size);
    q.elements = [...this.elements];
    return q;
  }

  toArrayString(): string {
    return this.elements?.join("") ?? "";
  }
}
