'use strict';

const InventoryDialog = require('voxel-inventory-dialog').InventoryDialog;
const Inventory = require('inventory');
const InventoryWindow = require('inventory-window');

module.exports = (game, opts) => new Workbench(game, opts);

module.exports.pluginInfo = {
  loadAfter: ['voxel-registry', 'voxel-recipes', 'voxel-carry']
};

class Workbench {
  constructor(game, opts) {
    this.game = game;
    if (!opts) opts = {};

    this.playerInventory = game.plugins.get('voxel-carry').inventory || opts.playerInventory; // TODO: proper error if voxel-carry missing
    if (!this.playerInventory) throw new Error('voxel-inventory-dialog requires "voxel-carry" plugin or playerInventory" set to inventory instance');

    this.registry = game.plugins.get('voxel-registry');
    if (!this.registry) throw new Error('voxel-workbench requires "voxel-registry" plugin');

    this.recipes = game.plugins.get('voxel-recipes');
    if (!this.recipes) throw new Error('voxel-workbench requires "voxel-recipes" plugin');

    if (opts.registerBlock === undefined) opts.registerBlock = true;
    if (opts.registerRecipe === undefined) opts.registerRecipe = true;
   
    if (this.game.isClient) {
      this.workbenchDialog = new WorkbenchDialog(game, this.playerInventory, this.registry, this.recipes);
    }

    this.opts = opts;
    this.enable();
  }

  enable() {
    if (this.opts.registerBlock) {
      this.registry.registerBlock('workbench', {texture: ['crafting_table_top', 'planks_oak', 'crafting_table_side'], onInteract: () => {
        // TODO: server-side
        this.workbenchDialog.open()
        return true;
      }
      });
    }

    if (this.opts.registerRecipe) {
      this.recipes.registerAmorphous(['wood.plank', 'wood.plank', 'wood.plank', 'wood.plank'], ['workbench']);
    }
  }

  disable() {
    // TODO
  }
}

class WorkbenchDialog extends InventoryDialog {
  constructor(game, playerInventory, registry, recipes) {

    // TODO: clear these inventories on close, or store in per-block metadata
    const craftInventory = new Inventory(3, 3)
    craftInventory.on('changed', () => this.updateCraftingRecipe());
    const craftIW = new InventoryWindow({width:3, registry:registry, inventory:craftInventory, linkedInventory:playerInventory});

    const resultInventory = new Inventory(1);
    const resultIW = new InventoryWindow({inventory:resultInventory, registry:registry, allowDrop:false, linkedInventory:playerInventory});
    resultIW.on('pickup', () => this.tookCraftingOutput());

    // crafting + result div, upper
    const crDiv = document.createElement('div');
    crDiv.style.display = 'flex';
    crDiv.style.flexFlow = 'row';
    crDiv.style.justifyContent = 'center';

    const empty = document.createElement('div');
    empty.style.width = '33%';
   
    const craftCont = craftIW.createContainer();
    const craftContOuter = document.createElement('div');
    craftContOuter.style.width = '33%';
    craftContOuter.style.paddingTop = '15px'; // top space
    craftContOuter.appendChild(craftCont);

    const resultCont = resultIW.createContainer();
    resultCont.style.alignSelf = 'center';
    resultCont.style.marginLeft = '30px';  // separate from crafting grid
    const resultContOuter = document.createElement('div');
    resultContOuter.style.display = 'flex';
    resultContOuter.style.width = '33%';
    resultContOuter.style.flexFlow = 'column';
    resultContOuter.style.justifyContent = 'center';
    resultContOuter.appendChild(resultCont);

    crDiv.appendChild(empty);
    crDiv.appendChild(craftContOuter);
    crDiv.appendChild(resultContOuter);

    super(game, {
      upper: [crDiv]
    });

    this.game = game;
    this.playerInventory = playerInventory;
    this.registry = registry;
    this.recipes = recipes;

    this.craftIW = craftIW;
    this.craftInventory = craftInventory;

    this.resultInventory = resultInventory;
    this.resultIW = resultIW;
  }

  // changed crafting grid, so update recipe output
  updateCraftingRecipe() {
    const recipe = this.recipes.find(this.craftInventory);
    console.log('found recipe',recipe);
    this.resultInventory.set(0, recipe !== undefined ? recipe.computeOutput(this.craftInventory) : undefined);
  }

  // picked up crafting recipe output, so consume crafting grid ingredients
  tookCraftingOutput() {
    const recipe = this.recipes.find(this.craftInventory);
    if (recipe === undefined) return;

    recipe.craft(this.craftInventory);
    this.craftInventory.changed();
  }

  close() {
    // exiting workbench returns in-progress crafting ingredients to player
    // TODO: inventory transfer() method
    for (let i = 0; i < this.craftInventory.size(); ++i) {
      if (this.craftInventory.get(i)) {
        const excess = this.playerInventory.give(this.craftInventory.get(i));
        //if excess // too bad, player loses if can't fit
      }

      this.craftInventory.set(i, undefined);
    }

    super.close()
  }
}


