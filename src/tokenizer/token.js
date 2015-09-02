/**
 * @jsx React.DOM
 */

var React = require('react');
var classNames = require('classnames');
var Paper = require('material-ui').Paper;
var CloseIcon = require('material-ui/lib/svg-icons/navigation/close');
var _ = require('lodash');


/**
 * Encapsulates the rendering of an option that has been "selected" in a
 * TypeaheadTokenizer
 */
var Token = React.createClass({
  propTypes: {
    className: React.PropTypes.string,
    name: React.PropTypes.string,
    children: React.PropTypes.string,
    onRemove: React.PropTypes.func
  },

  style: function() {
    return {
      root: {
        display: 'inline-block',
        padding: '4px 5px',
        margin: '0 10px 10px 0'
      },
      children: {
        display: 'inline-block',
        verticalAlign: 'middle'
      },
      close: {
        marginLeft: '10px'
      }
    }
  },

  render: function() {
    var className = classNames([
      'typeahead-token',
      this.props.className
    ]);

    return (
      <Paper style={ this.style().root } >
        <div style={ this.style().container } className={className}>
          {this._renderHiddenInput()}
          {this.props.children}
          {this._renderCloseButton()}
        </div>
      </Paper>
    );
  },

  _renderHiddenInput: function() {
    // If no name was set, don't create a hidden input
    if (!this.props.name) {
      return null;
    }

    return (
      <input
        style={ this.style().children }
        type="hidden"
        name={ this.props.name + '[]' }
        value={ this.props.children }
      />
    );
  },

  _renderCloseButton: function() {
    if (!this.props.onRemove) {
      return "";
    }
    return (
      <a style={ _.assign(this.style().children, this.style().close ) }
         className="typeahead-token-close"
         href="#"
         onClick={function(event) {
          this.props.onRemove(this.props.children);
          event.preventDefault();
        }.bind(this)}>
        <CloseIcon />
      </a>
    );
  }
});

module.exports = Token;
