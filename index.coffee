
InventoryDialog = (require 'voxel-inventory-dialog').InventoryDialog
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'

module.exports = (game, opts) ->
  return new Workbench(game, opts)

module.exports.pluginInfo =
  loadAfter: ['voxel-registry', 'voxel-recipes', 'voxel-carry']

class Workbench
  constructor: (@game, opts) ->
    opts ?= {}

    @playerInventory = game.plugins?.get('voxel-carry')?.inventory ? opts.playerInventory ? throw new Error('voxel-workbench requires "voxel-carry" plugin or "playerInventory" set to inventory instance')
    @registry = game.plugins?.get('voxel-registry') ? throw new Error('voxel-workbench requires "voxel-registry" plugin')
    @recipes = game.plugins?.get('voxel-recipes') ? throw new Error('voxel-workbench requires "voxel-recipes" plugin')

    opts.registerBlock ?= true
    opts.registerRecipe ?= true
   
    if @game.isClient
      @workbenchDialog = new WorkbenchDialog(game, @playerInventory, @registry, @recipes)

    @opts = opts
    @enable()

  enable: () ->
    if @opts.registerBlock
      @registry.registerBlock 'workbench', {texture: ['crafting_table_top', 'planks_oak', 'crafting_table_side'], onInteract: () =>
        # TODO: server-side
        @workbenchDialog.open()
        true
      }

    if @opts.registerRecipe
      @recipes.registerAmorphous(['wood.plank', 'wood.plank', 'wood.plank', 'wood.plank'], ['workbench'])

  disable: () ->
    # TODO


class WorkbenchDialog extends InventoryDialog
  constructor: (@game, @playerInventory, @registry, @recipes) ->

    # TODO: clear these inventories on close, or store in per-block metadata
    @craftInventory = new Inventory(3, 3)
    @craftInventory.on 'changed', () => @updateCraftingRecipe()
    @craftIW = new InventoryWindow {width:3, registry:@registry, inventory:@craftInventory, linkedInventory:@playerInventory}

    @resultInventory = new Inventory(1)
    @resultIW = new InventoryWindow {inventory:@resultInventory, registry:@registry, allowDrop:false, linkedInventory:@playerInventory}
    @resultIW.on 'pickup', () => @tookCraftingOutput()

    # crafting + result div, upper
    crDiv = document.createElement 'div'
    crDiv.style.display = 'flex'
    crDiv.style.flexFlow = 'row'
    crDiv.style.justifyContent = 'center'

    empty = document.createElement 'div'
    empty.style.width = '33%'
   
    craftCont = @craftIW.createContainer()
    craftContOuter = document.createElement 'div'
    craftContOuter.style.width = '33%'
    craftContOuter.style.paddingTop = '15px' # top space
    craftContOuter.appendChild craftCont

    resultCont = @resultIW.createContainer()
    resultCont.style.alignSelf = 'center'
    resultCont.style.marginLeft = '30px'  # separate from crafting grid
    resultContOuter = document.createElement 'div'
    resultContOuter.style.display = 'flex'
    resultContOuter.style.width = '33%'
    resultContOuter.style.flexFlow = 'column'
    resultContOuter.style.justifyContent = 'center'
    resultContOuter.appendChild resultCont

    crDiv.appendChild empty
    crDiv.appendChild craftContOuter
    crDiv.appendChild resultContOuter


    super game,
      upper: [crDiv]

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

  close: () ->
    # exiting workbench returns in-progress crafting ingredients to player
    # TODO: inventory transfer() method
    for i in [0...@craftInventory.size()]
      if @craftInventory.get(i)
        excess = @playerInventory.give @craftInventory.get(i)
        #if excess # too bad, player loses if can't fit

      @craftInventory.set i, undefined

    super()


