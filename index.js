// Generated by CoffeeScript 1.6.3
(function() {
  var AmorphousRecipe, CraftingThesaurus, Inventory, InventoryWindow, ItemPile, ModalDialog, PositionalRecipe, Recipe, RecipeList, Workbench, WorkbenchDialog, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ModalDialog = require('voxel-modal-dialog');

  Inventory = require('inventory');

  InventoryWindow = require('inventory-window');

  ItemPile = require('itempile');

  _ref = require('craftingrecipes'), Recipe = _ref.Recipe, AmorphousRecipe = _ref.AmorphousRecipe, PositionalRecipe = _ref.PositionalRecipe, CraftingThesaurus = _ref.CraftingThesaurus, RecipeList = _ref.RecipeList;

  module.exports = function(game, opts) {
    return new Workbench(game, opts);
  };

  module.exports.pluginInfo = {
    loadAfter: ['voxel-registry', 'craftingrecipes', 'voxel-carry']
  };

  Workbench = (function() {
    function Workbench(game, opts) {
      var _ref1, _ref2, _ref3;
      this.game = game;
      if (opts == null) {
        opts = {};
      }
      this.playerInventory = (function() {
        var _ref2, _ref3, _ref4;
        if ((_ref1 = (_ref2 = (_ref3 = game.plugins) != null ? (_ref4 = _ref3.get('voxel-carry')) != null ? _ref4.inventory : void 0 : void 0) != null ? _ref2 : opts.playerInventory) != null) {
          return _ref1;
        } else {
          throw 'voxel-workbench requires "voxel-carry" plugin or "playerInventory" set to inventory instance';
        }
      })();
      this.registry = (function() {
        var _ref3;
        if ((_ref2 = (_ref3 = game.plugins) != null ? _ref3.get('voxel-registry') : void 0) != null) {
          return _ref2;
        } else {
          throw 'voxel-workbench requires "voxel-registry" plugin';
        }
      })();
      this.recipes = (function() {
        var _ref4;
        if ((_ref3 = (_ref4 = game.plugins) != null ? _ref4.get('craftingrecipes') : void 0) != null) {
          return _ref3;
        } else {
          throw 'voxel-workbench requires "craftingrecipes" plugin';
        }
      })();
      if (opts.registerBlock == null) {
        opts.registerBlock = true;
      }
      if (opts.registerRecipe == null) {
        opts.registerRecipe = true;
      }
      this.workbenchDialog = new WorkbenchDialog(game, this.playerInventory, this.registry, this.recipes);
      this.opts = opts;
      this.enable();
    }

    Workbench.prototype.enable = function() {
      var _this = this;
      if (this.opts.registerBlock) {
        this.registry.registerBlock('workbench', {
          texture: ['crafting_table_top', 'planks_oak', 'crafting_table_side'],
          onInteract: function() {
            _this.workbenchDialog.open();
            return true;
          }
        });
      }
      if (this.opts.registerRecipe) {
        return this.recipes.register(new AmorphousRecipe(['wood.plank', 'wood.plank', 'wood.plank', 'wood.plank'], new ItemPile('workbench', 1)));
      }
    };

    Workbench.prototype.disable = function() {};

    return Workbench;

  })();

  WorkbenchDialog = (function(_super) {
    __extends(WorkbenchDialog, _super);

    function WorkbenchDialog(game, playerInventory, registry, recipes) {
      var contents, crDiv, craftCont, resultCont,
        _this = this;
      this.game = game;
      this.playerInventory = playerInventory;
      this.registry = registry;
      this.recipes = recipes;
      this.playerIW = new InventoryWindow({
        width: 10,
        registry: this.registry,
        inventory: this.playerInventory
      });
      this.craftInventory = new Inventory(3, 3);
      this.craftInventory.on('changed', function() {
        return _this.updateCraftingRecipe();
      });
      this.craftIW = new InventoryWindow({
        width: 3,
        registry: this.registry,
        inventory: this.craftInventory,
        linkedInventory: this.playerInventory
      });
      this.resultInventory = new Inventory(1);
      this.resultIW = new InventoryWindow({
        inventory: this.resultInventory,
        registry: this.registry,
        allowDrop: false,
        linkedInventory: this.playerInventory
      });
      this.resultIW.on('pickup', function() {
        return _this.tookCraftingOutput();
      });
      crDiv = document.createElement('div');
      crDiv.style.marginLeft = '30%';
      crDiv.style.marginBottom = '10px';
      craftCont = this.craftIW.createContainer();
      resultCont = this.resultIW.createContainer();
      resultCont.style.marginLeft = '30px';
      resultCont.style.marginTop = '15%';
      crDiv.appendChild(craftCont);
      crDiv.appendChild(resultCont);
      contents = [];
      contents.push(crDiv);
      contents.push(document.createElement('br'));
      contents.push(this.playerIW.createContainer());
      WorkbenchDialog.__super__.constructor.call(this, game, {
        contents: contents
      });
    }

    WorkbenchDialog.prototype.updateCraftingRecipe = function() {
      var recipe;
      recipe = this.recipes.find(this.craftInventory);
      console.log('found recipe', recipe);
      return this.resultInventory.set(0, recipe != null ? recipe.computeOutput(this.craftInventory) : void 0);
    };

    WorkbenchDialog.prototype.tookCraftingOutput = function() {
      var recipe;
      recipe = this.recipes.find(this.craftInventory);
      if (recipe == null) {
        return;
      }
      recipe.craft(this.craftInventory);
      return this.craftInventory.changed();
    };

    WorkbenchDialog.prototype.close = function() {
      var excess, i, _i, _ref1;
      for (i = _i = 0, _ref1 = this.craftInventory.size(); 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (this.craftInventory.get(i)) {
          excess = this.playerInventory.give(this.craftInventory.get(i));
        }
        this.craftInventory.set(i, void 0);
      }
      return WorkbenchDialog.__super__.close.call(this);
    };

    return WorkbenchDialog;

  })(ModalDialog);

}).call(this);
