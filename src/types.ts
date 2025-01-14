import { MapChange, StateChange, YDocument } from '@jupyter/ydoc';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { JSONObject } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import {
  IGlueSessionDataset,
  IGlueSessionLinks,
  IGlueSessionTabs
} from './_interface/glue.schema';

export interface IDict<T = any> {
  [key: string]: T;
}

export type ValueOf<T> = T[keyof T];

export interface IGlueSessionObjectChange {
  objectChange?: Array<any>;
}

export interface IGlueSessionSharedModelChange {
  contextChange?: MapChange;
  contentChange?: MapChange;
  objectChange?: Array<{
    name: string;
    key: string;
    newValue: any;
  }>;
  optionChange?: MapChange;
  stateChange?: StateChange<any>[];
}

export interface IGlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange> {
  contents: JSONObject;
  dataset: IGlueSessionDataset;
  links: IGlueSessionLinks;
  tabs: IGlueSessionTabs;
  contentsChanged: ISignal<IGlueSessionSharedModel, IDict>;
  datasetChanged: ISignal<IGlueSessionSharedModel, IDict>;
  linksChanged: ISignal<IGlueSessionSharedModel, IDict>;
  tabChanged: ISignal<IGlueSessionSharedModel, IDict>;
  tabsChanged: ISignal<IGlueSessionSharedModel, IDict>;

  getTabNames(): string[];
  getTabData(tabName: string): IDict<IGlueSessionViewerTypes> | undefined;
  moveTabItem(name: string, fromTab: string, toTab: string): void;
}

export interface IGlueSessionModel extends DocumentRegistry.IModel {
  isDisposed: boolean;
  sharedModel: IGlueSessionSharedModel;
  disposed: ISignal<any, void>;
}

export type IGlueSessionWidget = IDocumentWidget<Widget, IGlueSessionModel>;

export interface IControlPanelModel {
  sharedModel: IGlueSessionSharedModel | undefined;
  glueSessionChanged: ISignal<IControlPanelModel, IGlueSessionWidget | null>;
  selectedDataset: string | null;
  selectedDatasetChanged: ISignal<IControlPanelModel, void>;
  tabsChanged: ISignal<IControlPanelModel, void>;
  getTabs(): IGlueSessionTabs;
}

export type IGlueSessionViewerTypes = ValueOf<IGlueSessionTabs>[0];

export type DashboardCellView = {
  /**
   * If cell output+widget are visible in the layout.
   */
  hidden?: boolean;
  /**
   * Logical row position.
   */
  row?: number;
  /**
   * Logical column position.
   */
  col?: number;
  /**
   * Logical width.
   */
  width?: number;
  /**
   * Logical height.
   */
  height?: number;
  /**
   * Lock item.
   */
  locked?: boolean;
};

export interface ILoadLog {
  path: string;
}
