# vim: set shiftwidth=2 tabstop=2 softtabstop=2 expandtab:

Modal = require 'voxel-modal'

class WorkbenchDialog extends Modal
  constructor: (@game, opts) ->
    opts ?= {}
  
    # TODO
    super game, {element: div}

