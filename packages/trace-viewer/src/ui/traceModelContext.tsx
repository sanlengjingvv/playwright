/*
  Copyright (c) Microsoft Corporation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import * as React from 'react';
import type { TraceModel } from '@isomorphic/trace/traceModel';

export const TraceModelContext = React.createContext<TraceModel | undefined>(undefined);

export type TraceViewerBodyFormatter = (params: {
  body: string,
  contentType: string,
  url: string,
  method: string,
  kind: 'request' | 'response',
}) => Promise<string>;

export const TraceViewerBodyFormatterContext = React.createContext<TraceViewerBodyFormatter | undefined>(undefined);

export const useTraceModel = () => {
  return React.useContext(TraceModelContext);
};

export const useTraceViewerBodyFormatter = () => React.useContext(TraceViewerBodyFormatterContext);
