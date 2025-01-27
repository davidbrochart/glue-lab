import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { ReactWidget, Toolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { BoxPanel, Panel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { AdvancedLinking } from './advancedLinkingChoices';
import { LinkedDataset } from './linkedDataset';

export class Linking extends LinkEditorWidget {
  constructor(options: Linking.IOptions) {
    super(options);
    const { linkedDataset } = options;
    this.addClass('glue-LinkEditor-linking');

    this.titleValue = 'Linking';

    this.content.addWidget(
      this.mainContent([
        {
          name: 'Identity Linking',
          widget: this._identityLinking(linkedDataset.selections)
        },
        { name: 'Advanced Linking', widget: this._advancedLinking() }
      ])
    );

    linkedDataset.selectionChanged.connect(this.updateDataset, this);

    if (linkedDataset.selections) {
      this.updateDataset(linkedDataset, linkedDataset.selections);
    }
  }

  updateDataset(_sender: LinkedDataset, dataset: [string, string]): void {
    dataset.forEach((dataName, index) => {
      // no-op if the dataset did not change.
      if (dataName === this._currentDataset[index]) {
        return;
      }

      // Update identity toolbar item.
      this._identityToolbar.get(index).widget.node.innerText = dataset[index];

      // Remove all the existing widgets.
      while (this._identityAttributes[index].widgets.length) {
        this._identityAttributes[index].widgets[0].dispose();
      }

      // Add a new widget for each attribute.
      let attributes: string[] =
        this._sharedModel.dataset[dataName].primary_owner;

      attributes = attributes.sort();
      attributes.forEach(value => {
        const attribute = new Widget();
        attribute.title.label = value;
        attribute.addClass('glue-LinkEditor-attribute');
        attribute.node.innerText = value;
        attribute.node.onclick = () => {
          this.onAttributeClicked(attribute, index);
        };
        this._identityAttributes[index].addWidget(attribute);
      });

      // Updates the current dataset.
      this._currentDataset[index] = dataName;
    });
  }

  onAttributeClicked(attribute: Widget, index: number): void {
    const isSelected = attribute.hasClass('selected');

    // Remove sibling attribute selected class.
    (attribute.parent as Panel).widgets
      .filter(widget => widget.hasClass('selected'))
      .forEach(widget => widget.removeClass('selected'));

    // Select the attribute.
    if (!isSelected) {
      attribute.addClass('selected');
      this._selectedAttributes[index] = attribute.title.label;
    } else {
      this._selectedAttributes[index] = '';
    }

    // Enable/disable the Glue button.
    (
      this._identityToolbar.get(this._identityToolbar.length - 1)
        .widget as ToolbarButton
    ).enabled = this._selectedAttributes.every(value => value !== '');
  }

  glueIdentity = (): void => {
    console.log(
      `Glue identity: ${this._selectedAttributes[0]} <-> ${this._selectedAttributes[1]}`
    );
  };

  advancedLinkChanged = (sender: AdvancedLinking, linkType: string): void => {
    console.log(`Advanced link selected: '${linkType}'`);
  };

  glueAdvanced = (): void => {
    console.log('Glue advanced clicked');
  };

  _identityLinking(selections: [string, string]): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Identity linking';

    const glueToolbar = new Toolbar();
    const attributes = new BoxPanel({ direction: 'left-to-right' });

    selections.forEach((selection, index) => {
      const datasetName = new Widget();
      datasetName.addClass('glue-LinkEditor-linkingDatasetName');
      datasetName.node.innerText = selection;
      this._identityToolbar.push({
        name: `Dataset ${index}`,
        widget: datasetName
      });

      attributes.addWidget(this._identityAttributes[index]);
    });

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      enabled: false,
      onClick: this.glueIdentity
    });
    this._identityToolbar.push({ name: 'Glue', widget: glueButton });

    Array.from(this._identityToolbar).forEach(item =>
      glueToolbar.addItem(item.name, item.widget)
    );

    panel.addWidget(glueToolbar);

    panel.addWidget(attributes);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(attributes, 1);

    panel.hide();

    return panel;
  }

  _advancedLinking(): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Advanced linking';

    const glueToolbar = new Toolbar();
    const attributes = new BoxPanel({ direction: 'left-to-right' });

    const advancedSelect = new AdvancedLinking({});
    this._advancedToolbar.push({
      name: 'Select advanced',
      widget: ReactWidget.create(advancedSelect.render())
    });

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      onClick: this.glueAdvanced
    });
    this._advancedToolbar.push({ name: 'Glue', widget: glueButton });

    Array.from(this._advancedToolbar).forEach(item =>
      glueToolbar.addItem(item.name, item.widget)
    );

    advancedSelect.onChange.connect(this.advancedLinkChanged, this);
    panel.addWidget(glueToolbar);
    panel.addWidget(attributes);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(attributes, 1);

    panel.hide();

    return panel;
  }

  private _currentDataset = ['', ''];
  private _selectedAttributes = ['', ''];
  private _identityToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  private _identityAttributes = [new Panel(), new Panel()];
  private _advancedToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  // private _advancedAttributes = [new Panel(), new Panel()];
}

namespace Linking {
  export interface IOptions extends LinkEditorWidget.IOptions {
    linkedDataset: LinkedDataset;
  }
}
