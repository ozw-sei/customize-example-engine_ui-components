import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as WEBIFC from "web-ifc";
import * as FRAGS from "@thatopen/fragments";
import * as CUI from "../..";







const getAttributesRow = async (
  model: FRAGS.FragmentsGroup,
  expressID: number,
  _options?: {
    groupName?: string;
    includeClass?: boolean;
  },
) => {
  const attrsToIgnore = ["OwnerHistory", "ObjectPlacement", "CompositionType"];

  const defaultOptions = {
    groupName: "Attributes",
    includeClass: false,
  };
  const options = { ...defaultOptions, ..._options };
  const { groupName, includeClass } = options;

  const elementAttrs = (await model.getProperties(expressID)) ?? {};
  const attrsRow: BUI.TableGroupData = { data: { Name: groupName } };

  if (includeClass) {
    if (!attrsRow.children) attrsRow.children = [];
    attrsRow.children.push({
      data: {
        Name: "Class",
        Value: OBC.IfcCategoryMap[elementAttrs.type],
      },
    });
  }

  for (const attrName in elementAttrs) {
    if (attrsToIgnore.includes(attrName)) continue;
    const attrValue = elementAttrs[attrName];
    if (!attrValue) continue;
    if (typeof attrValue === "object" && !Array.isArray(attrValue)) {
      if (attrValue.type === WEBIFC.REF) continue;
      const valueRow: BUI.TableGroupData = {
        data: { Name: attrName, Value: attrValue.value },
      };
      if (!attrsRow.children) attrsRow.children = [];
      attrsRow.children.push(valueRow);
    }
  }
  return attrsRow;
};


const getClassificationsRow = async (
  model: FRAGS.FragmentsGroup,
  classificationIDs: number[],
) => {
  const row: BUI.TableGroupData = { data: { Name: "Classifications" } };
  for (const classificationID of classificationIDs) {
    const relAttrs = await model.getProperties(classificationID);
    if (relAttrs && relAttrs.type === WEBIFC.IFCCLASSIFICATIONREFERENCE) {
      const { value: sourceID } = relAttrs.ReferencedSource;
      const sourceAttrs = await model.getProperties(sourceID);
      if (!sourceAttrs) continue;
      const classificationRow: BUI.TableGroupData = {
        data: {
          Name: sourceAttrs.Name.value,
        },
        children: [
          {
            data: {
              Name: "Identification",
              Value:
                relAttrs.Identification?.value || relAttrs.ItemReference?.value,
            },
          },
          {
            data: {
              Name: "Name",
              Value: relAttrs.Name.value,
            },
          },
        ],
      };
      if (!row.children) row.children = [];
      row.children.push(classificationRow);
    }
  }
  return row;
};


const getPsetRow = async (model: FRAGS.FragmentsGroup, psetIDs: number[]) => {
  const row: BUI.TableGroupData = { data: { Name: "Property Sets" } };
  for (const psetID of psetIDs) {
    const setAttrs = await model.getProperties(psetID);
    if (!setAttrs) continue;
    const setRow: BUI.TableGroupData = {
      data: { Name: setAttrs.Name.value },
    };
    if (setAttrs.type !== WEBIFC.IFCPROPERTYSET) continue;
    for (const propHandle of setAttrs.HasProperties) {
      const { value: propID } = propHandle;
      const propAttrs = await model.getProperties(propID);
      if (!propAttrs) continue;
      const valueKey = Object.keys(propAttrs).find((attr) =>
        attr.includes("Value"),
      );
      if (!(valueKey && propAttrs[valueKey])) continue;
      const propRow: BUI.TableGroupData = {
        data: {
          Name: propAttrs.Name.value,
          Value: propAttrs[valueKey].value,
        },
      };
      if (!setRow.children) setRow.children = [];
      setRow.children.push(propRow);
    }
    if (!setRow.children) continue;
    if (!row.children) row.children = [];
    row.children.push(setRow);
  }
  return row;
};


const getQsetRow = async (model: FRAGS.FragmentsGroup, psetIDs: number[]) => {
  const row: BUI.TableGroupData = { data: { Name: "Quantity Sets" } };
  for (const psetID of psetIDs) {
    const setAttrs = await model.getProperties(psetID);
    if (!setAttrs) continue;
    const setRow: BUI.TableGroupData = {
      data: { Name: setAttrs.Name.value },
    };
    if (setAttrs.type !== WEBIFC.IFCELEMENTQUANTITY) continue;
    for (const qtoHandle of setAttrs.Quantities) {
      const { value: propID } = qtoHandle;
      const propAttrs = await model.getProperties(propID);
      if (!propAttrs) continue;
      const valueKey = Object.keys(propAttrs).find((attr) =>
        attr.includes("Value"),
      );
      if (!(valueKey && propAttrs[valueKey])) continue;
      const propRow: BUI.TableGroupData = {
        data: {
          Name: propAttrs.Name.value,
          Value: propAttrs[valueKey].value,
        },
      };
      if (!setRow.children) setRow.children = [];
      setRow.children.push(propRow);
    }
    if (!setRow.children) continue;
    if (!row.children) row.children = [];
    row.children.push(setRow);
  }
  return row;
};


const getMaterialRow = async (
  model: FRAGS.FragmentsGroup,
  materialIDs: number[],
) => {
  const row: BUI.TableGroupData = { data: { Name: "Materials" } };
  for (const materialID of materialIDs) {
    const relAttrs = await model.getProperties(materialID);
    if (relAttrs && relAttrs.type === WEBIFC.IFCMATERIALLAYERSETUSAGE) {
      const layerSetID = relAttrs.ForLayerSet.value;
      const layerSetAttrs = await model.getProperties(layerSetID);
      if (!layerSetAttrs) continue;
      for (const layerHandle of layerSetAttrs.MaterialLayers) {
        const { value: layerID } = layerHandle;
        const layerAttrs = await model.getProperties(layerID);
        if (!layerAttrs) continue;
        const materialAttrs = await model.getProperties(
          layerAttrs.Material.value,
        );
        if (!materialAttrs) continue;
        const layerRow = {
          data: {
            Name: "Layer",
          },
          children: [
            {
              data: {
                Name: "Thickness",
                Value: layerAttrs.LayerThickness.value,
              },
            },
            {
              data: {
                Name: "Material",
                Value: materialAttrs.Name.value,
              },
            },
          ],
        };
        if (!row.children) row.children = [];
        row.children.push(layerRow);
      }
    }
    if (relAttrs && relAttrs.type === WEBIFC.IFCMATERIALLIST) {
      for (const materialHandle of relAttrs.Materials) {
        const { value: materialID } = materialHandle;
        const materialAttrs = await model.getProperties(materialID);
        if (!materialAttrs) continue;
        const materialRow: BUI.TableGroupData = {
          data: {
            Name: "Name",
            Value: materialAttrs.Name.value,
          },
        };
        if (!row.children) row.children = [];
        row.children.push(materialRow);
      }
    }
    if (relAttrs && relAttrs.type === WEBIFC.IFCMATERIAL) {
      const materialAttrs = await model.getProperties(materialID);
      if (!materialAttrs) continue;
      const materialRow: BUI.TableGroupData = {
        data: {
          Name: "Name",
          Value: materialAttrs.Name.value,
        },
      };
      if (!row.children) row.children = [];
      row.children.push(materialRow);
    }
  }
  return row;
};

const computeTableData = async (
  components: OBC.Components,
  fragmentIdMap: FRAGS.FragmentIdMap,
) => {
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const fragments = components.get(OBC.FragmentsManager);
  const rows: BUI.TableGroupData[] = [];

  const data: {
    model: FRAGS.FragmentsGroup;
    expressIDs: Iterable<number>;
  }[] = [];

  const expressIDs = [];

  console.log("fragmentIdMap in templates", fragmentIdMap);

  for (const fragID in fragmentIdMap) {
    const fragment = fragments.list.get(fragID);
    if (!(fragment && fragment.group)) continue;
    const model = fragment.group;
    const existingModel = data.find((value) => value.model === model);
    if (existingModel) {
      for (const id of fragmentIdMap[fragID]) {
        (existingModel.expressIDs as Set<number>).add(id);
        expressIDs.push(id);
      }
    } else {
      const info = { model, expressIDs: new Set(fragmentIdMap[fragID]) };
      data.push(info);
    }
  }

  for (const value in data) {
    const { model, expressIDs } = data[value];
    const modelRelations = indexer.relationMaps[model.uuid];
    if (!modelRelations) continue;
    for (const expressID of expressIDs) {
      const elementAttrs = await model.getProperties(expressID);
      console.log(elementAttrs);
      if (!elementAttrs) continue;

      const elementRow: BUI.TableGroupData = {
        data: {
          Name: elementAttrs.Name?.value,
        },
      };

      rows.push(elementRow);

      const attributesRow = await getAttributesRow(model, expressID, {
        includeClass: true,
      });

      if (!elementRow.children) elementRow.children = [];
      elementRow.children.push(attributesRow);

      const elementRelations = modelRelations.get(expressID);
      if (!elementRelations) continue;

      const definedByRelations = indexer.getEntityRelations(
        model,
        expressID,
        "IsDefinedBy",
      );

      if (definedByRelations) {
        const psetRels = definedByRelations.filter(async (rel) => {
          const relAttrs = await model.getProperties(rel);
          if (relAttrs) {
            return relAttrs.type === WEBIFC.IFCPROPERTYSET;
          }
          return false;
        });
        const psetRow = await getPsetRow(model, psetRels);
        if (psetRow.children) elementRow.children.push(psetRow);

        const qsetRels = definedByRelations.filter(async (rel) => {
          const relAttrs = await model.getProperties(rel);
          if (relAttrs) {
            return relAttrs.type === WEBIFC.IFCELEMENTQUANTITY;
          }
          return false;
        });
        const qsetRow = await getQsetRow(model, qsetRels);
        if (qsetRow.children) elementRow.children.push(qsetRow);
      }

      const associateRelations = indexer.getEntityRelations(
        model,
        expressID,
        "HasAssociations",
      );

      if (associateRelations) {
        const materialRelations = associateRelations.filter(async (rel) => {
          const relAttrs = await model.getProperties(rel);
          if (relAttrs) {
            const isMaterial =
              relAttrs.type === WEBIFC.IFCMATERIALLAYERSETUSAGE ||
              relAttrs.type === WEBIFC.IFCMATERIALLAYERSET ||
              relAttrs.type === WEBIFC.IFCMATERIALLAYER ||
              relAttrs.type === WEBIFC.IFCMATERIAL ||
              relAttrs.type === WEBIFC.IFCMATERIALLIST;
            return isMaterial;
          }
          return false;
        });
        const materialRow = await getMaterialRow(model, materialRelations);
        if (materialRow.children) elementRow.children.push(materialRow);

        const classificationRelations = associateRelations.filter(
          async (rel) => {
            const relAttrs = await model.getProperties(rel);
            if (relAttrs) {
              const isClassification =
                relAttrs.type === WEBIFC.IFCCLASSIFICATIONREFERENCE;
              return isClassification;
            }
            return false;
          },
        );
        const classificationRow = await getClassificationsRow(
          model,
          classificationRelations,
        );
        if (classificationRow.children)
          elementRow.children.push(classificationRow);
      }

      const contianerRelations = indexer.getEntityRelations(
        model,
        expressID,
        "ContainedInStructure",
      );

      if (contianerRelations) {
        const containerID = contianerRelations[0];
        const attributesRow = await getAttributesRow(model, containerID, {
          groupName: "SpatialContainer",
        });
        elementRow.children.push(attributesRow);
      }
    }
  }
  return rows;
};


// =======================



BUI.Manager.init();

const viewport = document.createElement("bim-viewport");

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create();
const sceneComponent = new OBC.SimpleScene(components);
sceneComponent.setup();
world.scene = sceneComponent;

const rendererComponent = new OBC.SimpleRenderer(components, viewport);
world.renderer = rendererComponent;

const cameraComponent = new OBC.SimpleCamera(components);
world.camera = cameraComponent;
cameraComponent.controls.setLookAt(10, 5.5, 5, -4, -1, -6.5);

viewport.addEventListener("resize", () => {
  rendererComponent.resize();
  cameraComponent.updateAspect();
});

components.init();

const grids = components.get(OBC.Grids);
grids.create(world);

/* MD 
  ## Displaying data the simplest way 🔥🔥
  ---
  What is a good BIM app if you don't give users a nice way to visualize its model properties, right? Well, hold tight as here you will learn all you need to know in order to use the power of UI Components to accomplish that!

  ### Loading a model and computing it's relations
  First things first... let's load a model 👇
  */

const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();
const file = await fetch(
  "https://thatopen.github.io/engine_ui-components/resources/small.ifc",
);
const buffer = await file.arrayBuffer();
const typedArray = new Uint8Array(buffer);
const model = await ifcLoader.load(typedArray);
world.scene.three.add(model);

/* MD
  :::tip

  You don't need to add the model into the scene to display its properties. However, as we are going to display the properties for each selected element, then having the model into the scene is obvious, right?

  :::

  Now, in order to get the most out of the properties table, you need to calculate the relations index of your model. To do it, you will need to use the [IfcRelationsIndexer](/Tutorials/Components/Core/IfcRelationsIndexer) component from `@thatopen/components` to speed up the process.
  */

const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(model);

/* MD
  Once the relations are processed, the `Element Properties` component has everything it needs in order to display the properties in a cool way 😎.

  ### Creating the properties table
  Let's create an instance of the functional component, like this:
  */

const [propertiesTable, updatePropertiesTable] = CUI.tables.elementProperties({
  components,
  fragmentIdMap: {},
});

propertiesTable.preserveStructureOnFilter = true;
propertiesTable.indentationInText = false;

/* MD
  :::tip

  The `elementProperties` functional component is a simplified version that shows any model entity data. However, if you like a more complete properties table, use the `entityAttributes` component.

  :::

  Cool! properties table created. Then after, let's tell the properties table to update each time the user makes a selection over the model. For it, we will use the highlighter from `@thatopen/components-front`:
  */

const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });

highlighter.events.select.onHighlight.add((fragmentIdMap) => {
  console.log("fragmentIdMap", fragmentIdMap);
  computeTableData(components, fragmentIdMap).then((rows) => {
    console.log(rows);
  });
  updatePropertiesTable({ fragmentIdMap });
});

highlighter.events.select.onClear.add(() =>
  updatePropertiesTable({ fragmentIdMap: {} }),
);

/* MD
  ### Creating a panel to append the table
  Allright! Let's now create a BIM Panel to control some aspects of the properties table and to trigger some functionalities like expanding the rows children and copying the values to TSV, so you can paste your element values inside a spreadsheet application 😉
  */

const propertiesPanel = BUI.Component.create(() => {
  const onTextInput = (e: Event) => {
    const input = e.target as BUI.TextInput;
    propertiesTable.queryString = input.value !== "" ? input.value : null;
  };

  const expandTable = (e: Event) => {
    const button = e.target as BUI.Button;
    propertiesTable.expanded = !propertiesTable.expanded;
    button.label = propertiesTable.expanded ? "Collapse" : "Expand";
  };

  const copyAsTSV = async () => {
    await navigator.clipboard.writeText(propertiesTable.tsv);
  };
  console.log("propertiesTable", propertiesTable);

  return BUI.html`
    <bim-panel label="Properties">
      <bim-panel-section label="Element Data">
        <div style="display: flex; gap: 0.5rem;">
          <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button> 
          <bim-button @click=${copyAsTSV} label="Copy as TSV"></bim-button> 
        </div> 
        <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>
        ${propertiesTable}
      </bim-panel-section>
    </bim-panel>
  `;
});

/* MD
  Finally, let's create a BIM Grid element and provide both the panel and the viewport to display everything.
  */

const app = document.createElement("bim-grid");
app.layouts = {
  main: {
    template: `
    "propertiesPanel viewport"
    /25rem 1fr
    `,
    elements: { propertiesPanel, viewport },
  },
};

app.layout = "main";
document.body.append(app);

/* MD
  Congratulations! You have now created a fully working properties table for your app in less than 5 minutes of work. Keep going with more tutorials! 💪
  */
