import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { SessionWidget } from '../viewPanel/sessionWidget';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { GlueSessionModel } from './docModel';

import { GlueDocumentWidget } from '../viewPanel/glueDocumentWidget';
import { INotebookTracker } from '@jupyterlab/notebook';

export class GlueCanvasWidgetFactory extends ABCWidgetFactory<
  GlueDocumentWidget,
  GlueSessionModel
> {
  constructor(options: GlueCanvasWidgetFactory.IOptions) {
    const { rendermime, notebookTracker, ...rest } = options;
    super(rest);
    this._rendermime = rendermime;
    this._notebookTracker = notebookTracker;
  }

  /**
   * Create a new widget given a context.
   *
   * @param context Contains the information of the file
   * @returns The widget
   */
  protected createNewWidget(
    context: DocumentRegistry.IContext<GlueSessionModel>
  ): GlueDocumentWidget {
    const content = new SessionWidget({
      model: context.model.sharedModel,
      rendermime: this._rendermime,
      notebookTracker: this._notebookTracker,
      context
    });
    return new GlueDocumentWidget({ context, content });
  }

  private _rendermime: IRenderMimeRegistry;
  private _notebookTracker: INotebookTracker;
}

export namespace GlueCanvasWidgetFactory {
  export interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    rendermime: IRenderMimeRegistry;
    notebookTracker: INotebookTracker;
  }
}
