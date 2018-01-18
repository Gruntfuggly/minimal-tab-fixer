
var vscode = require( 'vscode' ),
    path = require( 'path' ),
    convertToSpaces = require( 'convert-to-spaces' ),
    exec = require( 'child_process' ).execSync;

function getRanges( array )
{
    for( var ranges = [], rend, i = 0; i < array.length; )
    {
        ranges.push( ( rend = array[ i ] ) + ( ( function( rstart )
        {
            while( ++rend === array[ ++i ] );
            return --rend === rstart;
        } )( rend ) ? '' : ':' + rend ) );
    }
    return ranges;
}

function activate( context )
{
    var disposable = vscode.commands.registerCommand( 'minimal-tab-fixer.fix', function()
    {
        var editor = vscode.window.activeTextEditor;
        var filepath = vscode.Uri.parse( editor.document.uri.path ).fsPath;
        var folder = path.dirname( filepath );
        var name = path.basename( filepath );

        var command = "git blame " + name + " | grep -n '^0\\{8\\} ' | cut -f1 -d: ";
        var status = exec( command, { cwd: folder } )
        var ranges = getRanges( ( status + "" ).split( "\n" ) );

        var edits = [];
        ranges.map( function( range )
        {
            if( range !== ":0" )
            {
                var edit = new vscode.WorkspaceEdit();
                var positions = range.split( ":" );
                if( positions.length === 2 )
                {
                    for( var l = positions[ 0 ] - 1; l <= positions[ 1 ] - 1; ++l )
                    {
                        var line = editor.document.lineAt( parseInt( l ) );
                        var replacement = convertToSpaces( line.text, editor.options.tabSize ).replace( /\s+$/,'');
                        edits.push( new vscode.TextEdit( line.range, replacement ) );
                    }
                }
            }
        } );
        if( edits.length > 0 )
        {
            var edit = new vscode.WorkspaceEdit();
            edit.set( editor.document.uri, edits );
            vscode.workspace.applyEdit( edit );
        }
    } );
    context.subscriptions.push( disposable );
}
exports.activate = activate;

function deactivate()
{
}
exports.deactivate = deactivate;
