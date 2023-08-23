export function makeRichGoogleDocsLink({
  text,
  url,
  name,
  prediction
}: {
  text: string
  url: string
  name: string
  prediction: number | undefined
}) {
  let pasteString = ` ⚖ ${text}`
  if (prediction) pasteString += ` (${name}: ${prediction !== undefined ? `${prediction * 100}% yes` : ''})`

  const data = JSON.stringify({
    data: JSON.stringify({
        "resolved": {
            "dsl_spacers": pasteString,
            "dsl_styleslices": [
                {
                    "stsl_type": "autogen",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "cell",
                    "stsl_trailing": {
                        "cell_bgc2": {
                            "clr_type": 0,
                            "hclr_color": ""
                        },
                        "cell_pt": 5,
                        "cell_pb": 5,
                        "cell_pl": 5,
                        "cell_pr": 5,
                        "cell_va": 2,
                        "cell_bgc2_i": false,
                        "cell_pt_i": false,
                        "cell_pb_i": false,
                        "cell_pl_i": false,
                        "cell_pr_i": false,
                        "cell_va_i": false,
                        "cell_cs": 1,
                        "cell_rs": 1,
                        "cell_edc": null,
                        "cell_esc": null,
                        "cell_bt": {
                            "brdr_c2": {
                                "clr_type": 0,
                                "hclr_color": null
                            },
                            "brdr_w": 0,
                            "brdr_ls": 0,
                            "brdr_s": 0
                        },
                        "cell_bb": {
                            "brdr_c2": {
                                "clr_type": 0,
                                "hclr_color": null
                            },
                            "brdr_w": 0,
                            "brdr_ls": 0,
                            "brdr_s": 0
                        },
                        "cell_bl": {
                            "brdr_c2": {
                                "clr_type": 0,
                                "hclr_color": null
                            },
                            "brdr_w": 0,
                            "brdr_ls": 0,
                            "brdr_s": 0
                        },
                        "cell_br": {
                            "brdr_c2": {
                                "clr_type": 0,
                                "hclr_color": null
                            },
                            "brdr_w": 0,
                            "brdr_ls": 0,
                            "brdr_s": 0
                        },
                        "cell_bt_i": true,
                        "cell_bb_i": true,
                        "cell_bl_i": true,
                        "cell_br_i": true
                    },
                    "stsl_trailingType": "cell",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "code_snippet",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "collapsed_heading",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "column_sector",
                    "stsl_leading": {
                        "css_cols": {
                            "cv": {
                                "op": "set",
                                "opValue": []
                            }
                        },
                        "css_ln": null,
                        "css_lb": false,
                        "css_ltr": true,
                        "css_st": "continuous",
                        "css_mb": null,
                        "css_mh": null,
                        "css_mf": null,
                        "css_ml": null,
                        "css_mr": null,
                        "css_mt": null,
                        "css_fi": null,
                        "css_hi": null,
                        "css_epfi": null,
                        "css_ephi": null,
                        "css_fpfi": null,
                        "css_fphi": null,
                        "css_ufphf": null,
                        "css_pnsi": null,
                        "css_fpo": null
                    },
                    "stsl_leadingType": "column_sector",
                    "stsl_trailing": {
                        "css_cols": {
                            "cv": {
                                "op": "set",
                                "opValue": []
                            }
                        },
                        "css_ln": null,
                        "css_lb": false,
                        "css_ltr": true,
                        "css_st": "continuous",
                        "css_mb": null,
                        "css_mh": null,
                        "css_mf": null,
                        "css_ml": null,
                        "css_mr": null,
                        "css_mt": null,
                        "css_fi": null,
                        "css_hi": null,
                        "css_epfi": null,
                        "css_ephi": null,
                        "css_fpfi": null,
                        "css_fphi": null,
                        "css_ufphf": null,
                        "css_pnsi": null,
                        "css_fpo": null
                    },
                    "stsl_trailingType": "column_sector",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "comment",
                    "stsl_styles": [
                        {
                            "cs_cids": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "doco_anchor",
                    "stsl_styles": [
                        {
                            "das_a": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "document",
                    "stsl_leading": {
                        "ds_b": {
                            "bg_c2": {
                                "clr_type": 0,
                                "hclr_color": "#ffffff"
                            }
                        },
                        "ds_df": {
                            "df_dm": 1
                        },
                        "ds_ln": {
                            "ln_lne": false,
                            "ln_lnm": 0
                        },
                        "ds_fi": null,
                        "ds_hi": null,
                        "ds_epfi": null,
                        "ds_ephi": null,
                        "ds_uephf": false,
                        "ds_fpfi": null,
                        "ds_fphi": null,
                        "ds_ufphf": false,
                        "ds_pnsi": 1,
                        "ds_mb": 72.00000000000001,
                        "ds_ml": 72.00000000000001,
                        "ds_mr": 72.00000000000001,
                        "ds_mt": 72.00000000000001,
                        "ds_ph": 792,
                        "ds_pw": 612,
                        "ds_rtd": "",
                        "ds_mh": 36,
                        "ds_mf": 36,
                        "ds_ulhfl": false,
                        "ds_lhs": 1,
                        "ds_fpo": false
                    },
                    "stsl_leadingType": "document",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "equation",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "equation_function",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "field",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "footnote",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "headings",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "horizontal_rule",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "ignore_spellcheck",
                    "stsl_styles": [
                        {
                            "isc_osh": null
                        }
                    ]
                },
                {
                    "stsl_type": "import_warnings",
                    "stsl_styles": [
                        {
                            "iws_iwids": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "language",
                    "stsl_trailing": {
                        "lgs_l": "en_GB"
                    },
                    "stsl_trailingType": "language",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "link",
                    "stsl_styles": [
                        {
                            "lnks_link": {
                                "lnk_type": 0,
                                "ulnk_url": url
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "list",
                    "stsl_trailing": {
                        "ls_nest": 0,
                        "ls_id": null,
                        "ls_c": null,
                        "ls_ts": {
                            "ts_bd": false,
                            "ts_fs": 11,
                            "ts_ff": "Arial",
                            "ts_it": false,
                            "ts_sc": false,
                            "ts_st": false,
                            "ts_tw": 400,
                            "ts_un": false,
                            "ts_va": "nor",
                            "ts_bgc2": {
                                "clr_type": 0,
                                "hclr_color": null
                            },
                            "ts_fgc2": {
                                "clr_type": 0,
                                "hclr_color": "#000000"
                            },
                            "ts_bd_i": false,
                            "ts_fs_i": false,
                            "ts_ff_i": false,
                            "ts_it_i": false,
                            "ts_sc_i": false,
                            "ts_st_i": false,
                            "ts_un_i": false,
                            "ts_va_i": false,
                            "ts_bgc2_i": false,
                            "ts_fgc2_i": false
                        }
                    },
                    "stsl_trailingType": "list",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "markup",
                    "stsl_styles": [
                        {
                            "ms_id": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "named_range",
                    "stsl_styles": [
                        {
                            "nrs_ei": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "paragraph",
                    "stsl_trailing": {
                        "ps_al": 0,
                        "ps_awao": true,
                        "ps_sd": null,
                        "ps_bbtw": null,
                        "ps_bb": null,
                        "ps_bl": null,
                        "ps_br": null,
                        "ps_bt": null,
                        "ps_hd": 0,
                        "ps_hdid": "",
                        "ps_ifl": 0,
                        "ps_il": 0,
                        "ps_ir": 0,
                        "ps_klt": false,
                        "ps_kwn": false,
                        "ps_ltr": true,
                        "ps_ls": 1.15,
                        "ps_lslm": 1,
                        "ps_pbb": false,
                        "ps_sm": 0,
                        "ps_sa": 0,
                        "ps_sb": 0,
                        "ps_al_i": false,
                        "ps_awao_i": false,
                        "ps_sd_i": false,
                        "ps_bbtw_i": false,
                        "ps_bb_i": false,
                        "ps_bl_i": false,
                        "ps_br_i": false,
                        "ps_bt_i": false,
                        "ps_ifl_i": false,
                        "ps_il_i": false,
                        "ps_ir_i": false,
                        "ps_klt_i": false,
                        "ps_kwn_i": false,
                        "ps_ls_i": false,
                        "ps_lslm_i": false,
                        "ps_pbb_i": false,
                        "ps_rd": "",
                        "ps_sm_i": false,
                        "ps_sa_i": false,
                        "ps_sb_i": false,
                        "ps_shd": false,
                        "ps_ts": {
                            "cv": {
                                "op": "set",
                                "opValue": []
                            }
                        }
                    },
                    "stsl_trailingType": "paragraph",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "row",
                    "stsl_trailing": {
                        "row_mh": 0,
                        "row_th": false,
                        "row_cs": false
                    },
                    "stsl_trailingType": "row",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "suppress_feature",
                    "stsl_styles": [
                        {
                            "sfs_sst": false
                        }
                    ]
                },
                {
                    "stsl_type": "tbl",
                    "stsl_trailing": {
                        "tbls_bc2": {
                            "clr_type": 0,
                            "hclr_color": "#000000"
                        },
                        "tbls_bw": 1,
                        "tbls_cols": {
                            "cv": {
                                "op": "set",
                                "opValue": [
                                    {
                                        "col_wt": 0,
                                        "col_wv": 54.75
                                    }
                                ]
                            }
                        },
                        "tbls_ltr": true,
                        "tbls_al": 0,
                        "tbls_in": 0,
                        "tbls_emcid": null,
                        "tbls_emrk": "",
                        "tbls_emoid": null,
                        "tbls_dshb": false,
                        "tbls_dsvb": false,
                        "tbls_esfc": false,
                        "tbls_esfr": false,
                        "tbls_eslc": false,
                        "tbls_eslr": false,
                        "tbls_cfb1h": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfb1v": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfb2h": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfb2v": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cffc": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cffr": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cflc": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cflr": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfnec": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfnwc": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfsec": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfswc": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_cfwt": {
                            "cfmt_cg": null,
                            "cfmt_ts": null,
                            "cfmt_ps": null
                        },
                        "tbls_tt": 0,
                        "tbls_pt": 0,
                        "tbls_ftp": {
                            "ft_p": {
                                "p_hp": {
                                    "hp_rt": 1,
                                    "hp_t": 1,
                                    "hp_a": 0,
                                    "hp_lo": 0
                                },
                                "p_vp": {
                                    "vp_rt": 1,
                                    "vp_t": 1,
                                    "vp_a": 0,
                                    "vp_to": 0
                                },
                                "p_tw": {
                                    "tw_t": 2,
                                    "tw_wd": 2
                                },
                                "p_bd": false
                            },
                            "ft_mt": 9,
                            "ft_mb": 9,
                            "ft_ml": 9,
                            "ft_mr": 9
                        }
                    },
                    "stsl_trailingType": "tbl",
                    "stsl_styles": []
                },
                {
                    "stsl_type": "text",
                    "stsl_styles": [
                        {
                            "ts_bd": false,
                            "ts_fs": 11,
                            "ts_ff": "Arial",
                            "ts_it": false,
                            "ts_sc": false,
                            "ts_st": false,
                            "ts_tw": 400,
                            "ts_un": false,
                            "ts_va": "nor",
                            "ts_bgc2": {
                                "clr_type": 0,
                                "hclr_color": "#d1d3d5"
                            },
                            "ts_fgc2": {
                                "clr_type": 0,
                                "hclr_color": "#000000"
                            },
                            "ts_bd_i": false,
                            "ts_fs_i": false,
                            "ts_ff_i": false,
                            "ts_it_i": false,
                            "ts_sc_i": false,
                            "ts_st_i": false,
                            "ts_un_i": false,
                            "ts_va_i": false,
                            "ts_bgc2_i": false,
                            "ts_fgc2_i": false
                        }
                    ]
                }
            ],
            "dsl_metastyleslices": [
                {
                    "stsl_type": "autocorrect",
                    "stsl_styles": [
                        {
                            "ac_ot": null,
                            "ac_ct": null,
                            "ac_type": null,
                            "ac_sm": {
                                "asm_s": 0,
                                "asm_rl": 0,
                                "asm_l": ""
                            },
                            "ac_id": ""
                        }
                    ]
                },
                {
                    "stsl_type": "collapsed_content",
                    "stsl_styles": [
                        {
                            "colc_icc": false
                        }
                    ]
                },
                {
                    "stsl_type": "composing_decoration",
                    "stsl_styles": [
                        {
                            "cd_u": false,
                            "cd_bgc": {
                                "clr_type": 0,
                                "hclr_color": null
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "composing_region",
                    "stsl_styles": [
                        {
                            "cr_c": false
                        }
                    ]
                },
                {
                    "stsl_type": "draft_comment",
                    "stsl_styles": [
                        {
                            "dcs_cids": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "ignore_word",
                    "stsl_styles": [
                        {
                            "iwos_i": false
                        }
                    ]
                },
                {
                    "stsl_type": "revision_diff",
                    "stsl_styles": [
                        {
                            "revdiff_dt": 0,
                            "revdiff_a": "",
                            "revdiff_aid": ""
                        }
                    ]
                },
                {
                    "stsl_type": "smart_todo",
                    "stsl_styles": [
                        {
                            "sts_cid": null,
                            "sts_ot": null,
                            "sts_ac": null,
                            "sts_hi": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            },
                            "sts_pa": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            },
                            "sts_dm": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "spellcheck",
                    "stsl_styles": [
                        {
                            "sc_id": "",
                            "sc_ow": null,
                            "sc_sl": null,
                            "sc_sugg": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            },
                            "sc_sm": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            }
                        }
                    ]
                },
                {
                    "stsl_type": "voice_corrections",
                    "stsl_styles": [
                        {
                            "vcs_c": {
                                "cv": {
                                    "op": "set",
                                    "opValue": []
                                }
                            },
                            "vcs_id": ""
                        }
                    ]
                },
                {
                    "stsl_type": "voice_dotted_span",
                    "stsl_styles": [
                        {
                            "vdss_p": null,
                            "vdss_id": ""
                        }
                    ]
                }
            ],
            "dsl_suggestedinsertions": {
                "sgsl_sugg": []
            },
            "dsl_suggesteddeletions": {
                "sgsl_sugg": []
            },
            "dsl_entitypositionmap": {},
            "dsl_entitymap": {},
            "dsl_entitytypemap": {},
            "dsl_drawingrevisionaccesstokenmap": {},
            "dsl_relateddocslices": {},
            "dsl_nestedmodelmap": {}
        },
        "autotext_content": {}
    }),
  })

  return { "application/x-vnd.google-docs-document-slice-clip+wrapped": data }
}
