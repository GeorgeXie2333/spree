# frozen_string_literal: true

require "json"

APPLY = ENV.fetch("APPLY", "false") == "true"
SOURCE_LOCALE = ENV.fetch("SOURCE_LOCALE", "zh-CN")

def missing_default_content(record, fields)
  fields.any? { |field| record.read_attribute(field).blank? }
end

def source_values(record, fields)
  Mobility.with_locale(SOURCE_LOCALE) do
    fields.to_h { |field| [field, record.public_send(field)] }
  end
end

def values_to_fill(record, fields)
  source_values(record, fields).select do |field, value|
    record.read_attribute(field).blank? && value.present?
  end
end

def repair_records(scope, fields, store)
  scope.includes(:translations).order(:id).filter_map do |record|
    next unless missing_default_content(record, fields)

    values = values_to_fill(record, fields)
    next if values.empty?

    result = { id: record.id, values: values, applied: false }
    next result unless APPLY

    record.with_lock do
      record.reload
      values = values_to_fill(record, fields)
      if values.empty?
        result[:values] = {}
        result[:skipped_due_to_concurrent_update] = true
        next
      end

      Mobility.with_locale(store.default_locale) do
        I18n.default_locale = store.default_locale
        values.each { |field, value| record.public_send("#{field}=", value) }
        record.save!
      end
      result[:values] = values
      result[:applied] = true
    end
    result
  end
end

store = Spree::Store.default
abort "No default Spree store found" unless store

I18n.default_locale = store.default_locale

results = {
  apply: APPLY,
  source_locale: SOURCE_LOCALE,
  target_locale: store.default_locale,
  products: [],
  taxons: []
}

ActiveRecord::Base.transaction do
  results[:products] = repair_records(Spree::Product.all, %w[name slug], store)
  results[:taxons] = repair_records(Spree::Taxon.all, %w[name permalink], store)
end

puts JSON.pretty_generate(results)
