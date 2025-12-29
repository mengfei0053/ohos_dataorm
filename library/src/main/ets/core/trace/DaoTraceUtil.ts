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

import { hiTraceMeter } from '@kit.PerformanceAnalysisKit';
import { DaoTraceSpace } from './traceConfig'
import { DaoLog } from '../DaoLog'

export { DaoTraceSpace };

/**
 * DaoTraceUtil
 * 可通过 setConfig 动态配置 trace 开关、级别和类型
 */
export class DaoTraceUtil {
  // Trace配置，enabled: 是否启用trace，minLevel: 最低trace级别，types: 允许的trace类型集合
  private static config: DaoTraceSpace.TraceConfig = {
    enabled: false, // 默认关闭 trace，需应用侧主动开启
    minLevel: DaoTraceSpace.TraceLevel.WARN, // 级别越低，记录越频繁
    types: new Set<DaoTraceSpace.TraceType>([DaoTraceSpace.TraceType.CRUD])
  };

  private static readonly taskMap: Map<string, number> = new Map();
  // 自增 taskId
  private static taskIdSeed: number = 1000;


  /**
   * 获取当前trace配置
   */
  public static getConfig(): DaoTraceSpace.TraceConfig {
    return this.config;
  }

  /**
   * 设置trace配置
   */
  public static setConfig(config: Partial<DaoTraceSpace.TraceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 生成唯一的taskId
   */
  private static nextTaskId(): number {
    return ++DaoTraceUtil.taskIdSeed;
  }

  /**
   * 开始trace
   * @param level TraceLevel，trace级别
   * @param type TraceType，trace类型
   * @param tag string，trace标签
   */
  public static start(tag: string, level: DaoTraceSpace.TraceLevel, type: DaoTraceSpace.TraceType): void {
    if (!this.config.enabled) {
      return;
    }
    if (level < this.config.minLevel) {
      return;
    }
    if (!this.config.types.has(type)) {
      return;
    }

    const taskId = this.nextTaskId();
    this.taskMap.set(tag, taskId);
    try {
      if (typeof hiTraceMeter.startTrace === 'function') {
        hiTraceMeter.startTrace(tag, taskId);
      }
    } catch (e: any) {
      DaoLog.w(`[DaoTraceUtil] start trace失败: ${e && e.message ? e.message : e}`);
    }
  }

  public static startDebug(tag: string, type: DaoTraceSpace.TraceType): void {
    this.start(tag, DaoTraceSpace.TraceLevel.DEBUG, type)
  }

  public static startInfo(tag: string, type: DaoTraceSpace.TraceType): void {
    this.start(tag, DaoTraceSpace.TraceLevel.INFO, type)
  }

  public static startWarn(tag: string, type: DaoTraceSpace.TraceType): void {
    this.start(tag, DaoTraceSpace.TraceLevel.WARN, type)
  }

  public static startError(tag: string, type: DaoTraceSpace.TraceType): void {
    this.start(tag, DaoTraceSpace.TraceLevel.ERROR, type)
  }

  /**
   * 结束trace
   * @param tag string，trace标签
   */
  public static finish(tag: string): void {
    if (!this.config.enabled) {
      return;
    }

    const taskId = this.taskMap.get(tag);
    if (taskId === null || taskId === undefined) {
      return;
    }

    try {
      if (typeof hiTraceMeter.finishTrace === 'function') {
        hiTraceMeter.finishTrace(tag, taskId);
      }
    } catch (e: any) {
      DaoLog.w(`[DaoTraceUtil] finish trace失败: ${e && e.message ? e.message : e}`);
    } finally {
      this.taskMap.delete(tag);
    }
  }
}
