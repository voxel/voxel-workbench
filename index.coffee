# vim: set shiftwidth=2 tabstop=2 softtabstop=2 expandtab:

Modal = require 'voxel-modal'
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'
ItemPile = require 'itempile'
{Recipe, AmorphousRecipe, PositionalRecipe, CraftingThesaurus, RecipeList} = require 'craftingrecipes'

class Workbench
  constructor: (@game, opts) ->
    opts ?= {}

    @playerInventory = opts.playerInventory ? throw 'voxel-workbench requires "playerInventory" set to inventory instance'
    @registry = game.plugins?.get('voxel-registry') ? throw 'voxel-workbench requires "voxel-registry" plugin'
    @recipes = game.plugins?.get('craftingrecipes') ? throw 'voxel-workbench requires "craftingrecipes" plugin'

    opts.registerBlock ?= true
    opts.registerRecipe ?= true
    
    @workbenchDialog = new WorkbenchDialog(game, @playerInventory, @registry, @recipes)

    @opts = opts
    @enable()

  enable: () ->
    if @opts.registerBlock
      @registry.registerBlock 'workbench', {texture: ['crafting_table_top', 'planks_oak', 'crafting_table_side'], onInteract: () =>
         @workbenchDialog.open()
         true
       }

    if @opts.registerRecipe
      @recipes.register new AmorphousRecipe(['wood.plank', 'wood.plank', 'wood.plank', 'wood.plank'], new ItemPile('workbench', 1))

  disable: () ->
    # TODO


class WorkbenchDialog extends Modal
  constructor: (@game, @playerInventory, @registry, @recipes) ->
    # TODO: refactor with voxel-inventory-dialog
    @playerIW = new InventoryWindow {
      width: 10
      inventory: @playerInventory
      }

    # TODO: clear these inventories on close, or store in per-block metadata
    @craftInventory = new Inventory(3, 3)
    @craftInventory.on 'changed', () => @updateCraftingRecipe()
    @craftIW = new InventoryWindow {width:3, inventory:@craftInventory}

    @resultInventory = new Inventory(1)
    @resultIW = new InventoryWindow {inventory:@resultInventory, allowDrop:false}
    @resultIW.on 'pickup', () => @tookCraftingOutput()

    # the overall dialog
    @dialog = document.createElement('div')
    @dialog.style.border = '6px outset gray'
    @dialog.style.visibility = 'hidden'
    @dialog.style.position = 'absolute'
    @dialog.style.top = '20%'
    @dialog.style.left = '30%'
    @dialog.style.zIndex = 1
    @dialog.style.backgroundImage = 'linear-gradient(rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 100%)'
    document.body.appendChild(@dialog)

    # crafting + result div, upper
    crDiv = document.createElement('div')
    crDiv.style.marginLeft = '30%'
    #crDiv.style.marginLeft = 'auto' # TODO: fix centering
    #crDiv.style.marginRight = 'auto'
    crDiv.style.marginBottom = '10px'
   
    craftCont = @craftIW.createContainer()

    resultCont = @resultIW.createContainer()
    resultCont.style.marginLeft = '30px'
    resultCont.style.marginTop = '15%'

    crDiv.appendChild(craftCont)
    crDiv.appendChild(resultCont)

    @dialog.appendChild(crDiv)
    @dialog.appendChild(document.createElement('br')) # TODO: better positioning
    # player inventory at bottom
    @dialog.appendChild(@playerIW.createContainer())

    super game, {element: @dialog}

  # TODO: refactor again from voxel-inventory-dialog's crafting

  # changed crafting grid, so update recipe output
  updateCraftingRecipe: () ->
    recipe = @recipes.find(@craftInventory)
    console.log 'found recipe',recipe
    @resultInventory.set 0, recipe?.computeOutput(@craftInventory)

  # picked up crafting recipe output, so consume crafting grid ingredients
  tookCraftingOutput: () ->
    recipe = @recipes.find(@craftInventory)
    return if not recipe?

    recipe.craft(@craftInventory)
    @craftInventory.changed()

module.exports = (game, opts) ->
  return new Workbench(game, opts)

module.exports.pluginInfo =
  loadAfter: ['voxel-registry', 'craftingrecipes']
