import { JSONObject, PromiseDelegate } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';

import { OutputAreaModel, SimplifiedOutputArea } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookTracker } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionViewerTypes
} from '../types';
import { GlueSessionModel } from '../document/docModel';
import { GridStackItem } from './gridStackItem';
import { ISignal, Signal } from '@lumino/signaling';

export class TabModel implements IDisposable {
  constructor(options: TabModel.IOptions) {
    const { tabName, rendermime, model, context, dataLoaded } = options;
    this._tabName = tabName;
    this._model = model;
    this._rendermime = rendermime;
    this._context = context;
    this._dataLoaded = dataLoaded;

    this._ready = new Signal<this, null>(this);

    this._context.sessionContext.ready.then(() => {
      this._ready.emit(null);
    });
  }

  /**
   * A signal emitted when the model is ready.
   */
  get ready(): ISignal<this, null> {
    return this._ready;
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._model;
  }

  get tabName(): string {
    return this._tabName;
  }

  get tabData(): IDict<IGlueSessionViewerTypes> {
    return this._model.getTabData(this._tabName) ?? {};
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
  }

  async *createView(): AsyncGenerator<GridStackItem | undefined> {
    for (const [name, view] of Object.entries(this.tabData)) {
      yield await this._createView(name, view);
    }
  }

  async _createView(
    viewId: string,
    viewData: IGlueSessionViewerTypes
  ): Promise<GridStackItem | undefined> {
    let item: GridStackItem | undefined = undefined;

    await this._dataLoaded.promise;

    // Extract plot state
    const state: { [k: string]: any } = {};
    if (viewData.state.values) {
      for (const prop in viewData.state.values) {
        const value = viewData.state.values[prop];
        // TODO Why do we need to do this??
        if (typeof value === 'string' && value.startsWith('st__')) {
          state[prop] = value.slice(4);
          continue;
        }

        state[prop] = value;
      }
    }
    // Merging the state with what's specified in "layers"
    // Only taking the state of the first layer
    // TODO Support multiple layers??
    if (
      viewData.layers &&
      viewData.layers[0]['state'] in this._model.contents
    ) {
      const extraState = (
        this._model.contents[viewData.layers[0]['state']] as JSONObject
      ).values as JSONObject;
      for (const prop in extraState) {
        const value = extraState[prop];
        // TODO Why do we need to do this??
        if (typeof value === 'string' && value.startsWith('st__')) {
          state[prop] = value.slice(4);
          continue;
        }

        state[prop] = value;
      }
    }

    switch (viewData._type) {
      case 'glue.viewers.scatter.qt.data_viewer.ScatterViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewId,
          cell: out,
          itemTitle: '2D Scatter',
          pos: viewData.pos,
          size: viewData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            scatter = app.scatter2d(data=data[state["layer"]])

            for key, value in state.items():
                try:
                    setattr(scatter.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.image.qt.data_viewer.ImageViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewId,
          cell: out,
          itemTitle: 'Image',
          pos: viewData.pos,
          size: viewData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            image = app.imshow(data=data[state["layer"]])
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.histogram.qt.data_viewer.HistogramViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewId,
          cell: out,
          itemTitle: 'Histogram',
          pos: viewData.pos,
          size: viewData.size
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            state = json.loads('${JSON.stringify(state)}')

            hist = app.histogram1d(data=data[state["layer"]])

            for key, value in state.items():
                try:
                    setattr(hist.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
    }
    return item;
  }

  private _isDisposed = false;
  private _ready: Signal<this, null>;
  private _tabName: string;
  private _model: IGlueSessionSharedModel;
  private _rendermime: IRenderMimeRegistry;
  private _context?: DocumentRegistry.IContext<GlueSessionModel>;
  private _dataLoaded: PromiseDelegate<void>;
}

export namespace TabModel {
  export interface IOptions {
    tabName: string;
    model: IGlueSessionSharedModel;
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    dataLoaded: PromiseDelegate<void>;
  }
}
